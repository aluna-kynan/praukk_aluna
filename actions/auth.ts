"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createClient();
  const cookieStore = await cookies();

  // Try standard Supabase Auth signIn
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!authError && authData?.user) {
    const userId = authData.user.id;
    let role = "peminjam";

    const { data: profile } = await supabase
      .from("pengguna")
      .select("peran")
      .eq("id", userId)
      .single();

    if (profile?.peran) {
      role = profile.peran;
    }

    cookieStore.set("user_id", userId, { path: "/", httpOnly: true });

    revalidatePath("/", "layout");
    return { success: true, role };
  }

  if (authError) {
    const msg = authError.message?.toLowerCase() || "";
    if (
      msg.includes("invalid login credentials") ||
      msg.includes("invalid") ||
      msg.includes("credentials") ||
      msg.includes("user not found")
    ) {
      return { error: "Email atau password salah. Silakan periksa kembali." };
    }
    if (msg.includes("email not confirmed")) {
      return {
        error:
          "Email belum dikonfirmasi di Supabase. Silakan konfirmasi email terlebih dahulu.",
      };
    }
    if (msg.includes("too many requests") || msg.includes("rate limit")) {
      return {
        error: "Terlalu banyak percobaan login. Silakan tunggu beberapa saat.",
      };
    }
    return { error: "Email atau password salah. Silakan periksa kembali." };
  }

  return { error: "Email atau password salah. Silakan periksa kembali." };
}

export async function logoutAction() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  await supabase.auth.signOut();
  cookieStore.set("user_id", "", { path: "/", maxAge: 0, expires: new Date(0) });
  cookieStore.delete("user_id");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function getCurrentUserAction() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const { data: { user } } = await supabase.auth.getUser();

  const targetUserId = cookieStore.get("user_id")?.value || user?.id;

  if (!targetUserId) {
    return null;
  }

  const { data: profile } = await supabase
    .from("pengguna")
    .select("*")
    .eq("id", targetUserId)
    .single();

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    email: user?.email || "",
    nama_lengkap: profile.nama_lengkap,
    peran: profile.peran,
  };
}
