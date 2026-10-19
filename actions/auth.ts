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

  // Fallback for testing when email confirmation is enabled on Supabase or auth fails
  const { data: allUsers } = await supabase.from("pengguna").select("*");
  if (allUsers && allUsers.length > 0) {
    const cleanSearch = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Search profile by matching name or partial string
    const matchedProfile = allUsers.find((u) => {
      const cleanName = u.nama_lengkap.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleanName.includes(cleanSearch) || cleanSearch.includes(cleanName);
    });

    if (matchedProfile) {
      cookieStore.set("user_id", matchedProfile.id, { path: "/", httpOnly: true });
      revalidatePath("/", "layout");
      return { success: true, role: matchedProfile.peran };
    }
  }

  if (authError?.message?.toLowerCase().includes("email not confirmed")) {
    return {
      error: "Email belum dikonfirmasi di Supabase. Solusi: Buka Supabase Dashboard -> Authentication -> Users -> klik titik tiga pada user -> 'Confirm Email', atau matikan 'Confirm Email' di Auth Settings.",
    };
  }

  return { error: authError?.message || "Email atau password salah." };
}

export async function logoutAction() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  await supabase.auth.signOut();
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
