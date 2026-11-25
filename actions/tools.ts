"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { KondisiAlat } from "@/types/database.types";
import { createLogAction } from "@/actions/logs";
import path from "path";
import { mkdir, writeFile, unlink } from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "tools");

function isWebpBuffer(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  return (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  );
}

async function saveWebpImage(file: File, prefix: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isWebpBuffer(buffer)) {
    throw new Error("Format file harus berupa WebP yang valid.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "alat";
  const filename = `${safePrefix}-${Date.now()}.webp`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await writeFile(filePath, buffer);
  return `/uploads/tools/${filename}`;
}

async function removeLocalImage(gambarUrl?: string | null) {
  if (!gambarUrl || !gambarUrl.startsWith("/uploads/tools/")) return;
  const filename = path.basename(gambarUrl);
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await unlink(filePath);
  } catch {
    // Abaikan jika file sudah tidak ada
  }
}

export async function getTools() {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("alat")
    .select(`
      *,
      kategori:kategori_id (id, nama)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback if created_at or dibuat_pada differs
    const fallback = await supabase
      .from("alat")
      .select(`
        *,
        kategori:kategori_id (id, nama)
      `);
    data = fallback.data;
  }

  return data || [];
}

export async function createTool(formData: FormData) {
  const nama = formData.get("nama") as string;
  const kategori_id = formData.get("kategori_id") as string;
  const stok_total = parseInt(formData.get("stok_total") as string, 10);
  const kondisi = (formData.get("kondisi") as KondisiAlat) || "baik";
  const gambarFile = formData.get("gambar") as File | null;

  if (!nama || !kategori_id || isNaN(stok_total) || stok_total < 0) {
    return { error: "Semua field wajib diisi dengan benar." };
  }

  let gambar_url: string | null = null;
  if (gambarFile && gambarFile.size > 0) {
    try {
      gambar_url = await saveWebpImage(gambarFile, nama);
    } catch (err: any) {
      return { error: err?.message || "Gagal memproses gambar WebP." };
    }
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("alat")
    .insert({
      nama,
      kategori_id,
      stok_total,
      stok_tersedia: stok_total,
      kondisi,
      ...(gambar_url ? { gambar_url } : {}),
    })
    .select("id")
    .single();

  if (error) {
    if (gambar_url) await removeLocalImage(gambar_url);
    return { error: error.message };
  }

  await createLogAction(`Menambah alat: ${nama}`, "alat", created?.id);

  revalidatePath("/admin/tools");
  revalidatePath("/tools");
  revalidatePath("/logs");
  return { success: true };
}

export async function updateTool(id: string, formData: FormData) {
  const nama = formData.get("nama") as string;
  const kategori_id = formData.get("kategori_id") as string;
  const stok_total = parseInt(formData.get("stok_total") as string, 10);
  const stok_tersedia = parseInt(formData.get("stok_tersedia") as string, 10);
  const kondisi = formData.get("kondisi") as KondisiAlat;
  const gambarFile = formData.get("gambar") as File | null;
  const removeGambar = formData.get("remove_gambar") === "true";

  const supabase = await createClient();

  let newGambarUrl: string | null | undefined = undefined;
  let oldGambarUrl: string | null = null;

  if ((gambarFile && gambarFile.size > 0) || removeGambar) {
    const { data: existing } = await supabase
      .from("alat")
      .select("gambar_url")
      .eq("id", id)
      .single();
    oldGambarUrl = existing?.gambar_url || null;

    if (gambarFile && gambarFile.size > 0) {
      try {
        newGambarUrl = await saveWebpImage(gambarFile, id);
      } catch (err: any) {
        return { error: err?.message || "Gagal memproses gambar WebP." };
      }
    } else if (removeGambar) {
      newGambarUrl = null;
    }
  }

  const updatePayload: Record<string, any> = {
    nama,
    kategori_id,
    stok_total,
    stok_tersedia,
    kondisi,
  };
  if (newGambarUrl !== undefined) {
    updatePayload.gambar_url = newGambarUrl;
  }

  const { error } = await supabase
    .from("alat")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    if (typeof newGambarUrl === "string") await removeLocalImage(newGambarUrl);
    return { error: error.message };
  }

  if (oldGambarUrl && newGambarUrl !== undefined) {
    await removeLocalImage(oldGambarUrl);
  }

  await createLogAction(`Memperbarui alat: ${nama}`, "alat", id);

  revalidatePath("/admin/tools");
  revalidatePath("/tools");
  revalidatePath("/logs");
  return { success: true };
}

export async function deleteTool(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("alat")
    .select("nama, gambar_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("alat").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (existing?.gambar_url) {
    await removeLocalImage(existing.gambar_url);
  }

  await createLogAction(`Menghapus alat: ${existing?.nama || id}`, "alat", id);

  revalidatePath("/admin/tools");
  revalidatePath("/tools");
  revalidatePath("/logs");
  return { success: true };
}
