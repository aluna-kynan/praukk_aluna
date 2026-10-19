"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PeranPengguna } from "@/types/database.types";

export async function getUsers() {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("pengguna")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    const fallback = await supabase.from("pengguna").select("*");
    data = fallback.data;
  }
  return data || [];
}

export async function createUserAction(formData: FormData) {
  const nama_lengkap = formData.get("nama_lengkap") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const peran = (formData.get("peran") as PeranPengguna) || "peminjam";

  if (!nama_lengkap || !nama_lengkap.trim()) {
    return { error: "Nama lengkap wajib diisi." };
  }

  const supabase = await createClient();

  // Step 1: Try direct insert into `pengguna` (works if foreign key constraint is dropped or optional)
  const randomId = crypto.randomUUID();
  const { error: directErr } = await supabase.from("pengguna").insert({
    id: randomId,
    nama_lengkap: nama_lengkap.trim(),
    peran,
  });

  if (!directErr) {
    revalidatePath("/users");
    return { success: true };
  }

  // Step 2: If direct insert failed due to foreign key (pengguna_id_fkey), attempt Supabase Auth signUp
  const userEmail = email && email.trim() ? email.trim() : `${nama_lengkap.toLowerCase().replace(/[^a-z0-9]/g, "")}@aluna.com`;
  const userPassword = password && password.trim() ? password.trim() : "password123";

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userEmail,
    password: userPassword,
  });

  if (authError) {
    if (authError.message?.toLowerCase().includes("rate limit")) {
      return {
        error: "Limit email Supabase terlampaui. Solusi cepat: Matikan 'Confirm Email' di Supabase Dashboard (Authentication -> Providers -> Email), atau jalankan SQL: `ALTER TABLE pengguna DROP CONSTRAINT IF EXISTS pengguna_id_fkey;` di SQL Editor.",
      };
    }
    return { error: `Gagal membuat autentikasi: ${authError.message}` };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { error: "Tidak dapat memperoleh ID pengguna dari Supabase Auth." };
  }

  // Step 3: Insert record into `pengguna` matching auth.users ID
  const { error: dbError } = await supabase.from("pengguna").insert({
    id: userId,
    nama_lengkap: nama_lengkap.trim(),
    peran,
  });

  if (dbError) {
    if (dbError.code === "23505") { // duplicate key
      await supabase.from("pengguna").update({ nama_lengkap: nama_lengkap.trim(), peran }).eq("id", userId);
      revalidatePath("/users");
      return { success: true };
    }
    return { error: dbError.message };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUserRole(id: string, peran: PeranPengguna) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pengguna")
    .update({ peran })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pengguna").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/users");
  return { success: true };
}
