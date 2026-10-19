"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const supabase = await createClient();
  const { error } = await supabase.from("kategori").insert({
    nama: nama.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/categories");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const nama = formData.get("nama") as string;

  if (!nama || !nama.trim()) {
    return { error: "Nama kategori wajib diisi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("kategori")
    .update({ nama: nama.trim() })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("kategori").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/categories");
  return { success: true };
}
