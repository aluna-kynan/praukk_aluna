"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { KondisiAlat } from "@/types/database.types";

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

  if (!nama || !kategori_id || isNaN(stok_total) || stok_total < 0) {
    return { error: "Semua field wajib diisi dengan benar." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("alat").insert({
    nama,
    kategori_id,
    stok_total,
    stok_tersedia: stok_total,
    kondisi,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/tools");
  revalidatePath("/tools");
  return { success: true };
}

export async function updateTool(id: string, formData: FormData) {
  const nama = formData.get("nama") as string;
  const kategori_id = formData.get("kategori_id") as string;
  const stok_total = parseInt(formData.get("stok_total") as string, 10);
  const stok_tersedia = parseInt(formData.get("stok_tersedia") as string, 10);
  const kondisi = formData.get("kondisi") as KondisiAlat;

  const supabase = await createClient();
  const { error } = await supabase
    .from("alat")
    .update({
      nama,
      kategori_id,
      stok_total,
      stok_tersedia,
      kondisi,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/tools");
  revalidatePath("/tools");
  return { success: true };
}

export async function deleteTool(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("alat").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/tools");
  revalidatePath("/tools");
  return { success: true };
}
