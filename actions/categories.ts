"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createLogAction } from "@/actions/logs";

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kategori")
    .select("*")
    .order("nama", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    const fallback = await supabase.from("kategori").select("*");
    return fallback.data || [];
  }
  return data || [];
}

export async function createCategory(formData: FormData) {
  const nama = formData.get("nama") as string;

  if (!nama || !nama.trim()) {
    return { error: "Nama kategori wajib diisi." };
  }

  const trimmed = nama.trim();
  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("kategori")
    .insert({ nama: trimmed })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await createLogAction(`Menambah kategori: ${trimmed}`, "kategori", created?.id);

  revalidatePath("/categories");
  revalidatePath("/logs");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const nama = formData.get("nama") as string;

  if (!nama || !nama.trim()) {
    return { error: "Nama kategori wajib diisi." };
  }

  const trimmed = nama.trim();
  const supabase = await createClient();
  const { error } = await supabase
    .from("kategori")
    .update({ nama: trimmed })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await createLogAction(`Memperbarui kategori: ${trimmed}`, "kategori", id);

  revalidatePath("/categories");
  revalidatePath("/logs");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("kategori")
    .select("nama")
    .eq("id", id)
    .single();

  const { count } = await supabase
    .from("alat")
    .select("id", { count: "exact", head: true })
    .eq("kategori_id", id);

  if (count && count > 0) {
    return {
      error: `Kategori tidak dapat dihapus karena masih ada ${count} alat yang tersedia pada kategori ini.`,
    };
  }

  const { error } = await supabase.from("kategori").delete().eq("id", id);

  if (error) {
    if (error.code === "23503" || error.message?.toLowerCase().includes("foreign key")) {
      return {
        error: "Kategori tidak dapat dihapus karena masih ada alat yang tersedia pada kategori ini.",
      };
    }
    return { error: error.message };
  }

  await createLogAction(
    `Menghapus kategori: ${existing?.nama || id}`,
    "kategori",
    id
  );

  revalidatePath("/categories");
  revalidatePath("/logs");
  return { success: true };
}
