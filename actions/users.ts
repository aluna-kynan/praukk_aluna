"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PeranPengguna } from "@/types/database.types";

// ─────────────────────────────────────────────
// Helper: catat log aktivitas (server-side)
// ─────────────────────────────────────────────
export async function catatLog(aksi: string, tabel?: string, idTarget?: string) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = cookieStore.get("user_id")?.value || user?.id || null;

    // 1. Coba insert langsung ke tabel log_aktivitas
    const payload: Record<string, any> = {
      aksi,
      tabel_target: tabel ?? null,
      id_target: idTarget ?? null,
    };
    if (currentUserId) {
      payload.pengguna_id = currentUserId;
    }

    const { error: insertErr } = await supabase.from("log_aktivitas").insert(payload);

    // 2. Jika gagal, fallback ke RPC fn_catat_log
    if (insertErr) {
      await supabase.rpc("fn_catat_log", {
        p_aksi: aksi,
        p_tabel_target: tabel ?? null,
        p_id_target: idTarget ?? null,
      });
    }
  } catch (err) {
    console.error("catatLog error:", err);
  }
}

// ─────────────────────────────────────────────
// GET all users
// ─────────────────────────────────────────────
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

  // Ambil riwayat perubahan profil/peran/password dari log_aktivitas
  let { data: logs, error: logErr } = await supabase
    .from("log_aktivitas")
    .select("id_target, aksi, created_at")
    .eq("tabel_target", "pengguna")
    .order("created_at", { ascending: false });

  if (logErr) {
    const logFallback = await supabase
      .from("log_aktivitas")
      .select("id_target, aksi, dibuat_pada")
      .eq("tabel_target", "pengguna")
      .order("dibuat_pada", { ascending: false });
    logs = logFallback.data as any;
  }

  const lastUpdateMap: Record<string, string> = {};
  for (const log of logs || []) {
    const targetId = (log as any).id_target;
    const aksi: string = (log as any).aksi || "";
    const ts = (log as any).created_at || (log as any).dibuat_pada;
    if (!targetId || !ts) continue;
    // Abaikan log pembuatan akun awal agar hanya mencatat perubahan profil/peran/password
    if (aksi.startsWith("Menambah pengguna")) continue;
    if (!lastUpdateMap[targetId]) {
      lastUpdateMap[targetId] = ts;
    }
  }

  return (data || []).map((u: any) => ({
    ...u,
    terakhir_diubah: u.diubah_pada || lastUpdateMap[u.id] || null,
  }));
}

// ─────────────────────────────────────────────
// CREATE user
// ─────────────────────────────────────────────
export async function createUserAction(formData: FormData) {
  const nama_lengkap = formData.get("nama_lengkap") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const peran = (formData.get("peran") as PeranPengguna) || "peminjam";

  if (!nama_lengkap || !nama_lengkap.trim()) {
    return { error: "Nama lengkap wajib diisi." };
  }

  const supabase = await createClient();

  // Step 1: Try direct insert (works if FK constraint is optional)
  const randomId = crypto.randomUUID();
  const { error: directErr } = await supabase.from("pengguna").insert({
    id: randomId,
    nama_lengkap: nama_lengkap.trim(),
    peran,
  });

  if (!directErr) {
    await catatLog(
      `Menambah pengguna baru: ${nama_lengkap.trim()} (${peran})`,
      "pengguna",
      randomId
    );
    revalidatePath("/users");
    return { success: true };
  }

  // Step 2: Supabase Auth signUp (needed if FK constraint is active)
  const userEmail =
    email && email.trim()
      ? email.trim()
      : `${nama_lengkap.toLowerCase().replace(/[^a-z0-9]/g, "")}@aluna.com`;
  const userPassword =
    password && password.trim() ? password.trim() : "password123";

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userEmail,
    password: userPassword,
  });

  if (authError) {
    if (authError.message?.toLowerCase().includes("rate limit")) {
      return {
        error:
          "Limit email Supabase terlampaui. Solusi: Matikan 'Confirm Email' di Supabase Dashboard (Authentication → Providers → Email), atau jalankan SQL: `ALTER TABLE pengguna DROP CONSTRAINT IF EXISTS pengguna_id_fkey;`",
      };
    }
    return { error: `Gagal membuat akun: ${authError.message}` };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { error: "Tidak dapat memperoleh ID pengguna." };
  }

  const { error: dbError } = await supabase.from("pengguna").insert({
    id: userId,
    nama_lengkap: nama_lengkap.trim(),
    peran,
  });

  if (dbError) {
    if (dbError.code === "23505") {
      await supabase
        .from("pengguna")
        .update({ nama_lengkap: nama_lengkap.trim(), peran })
        .eq("id", userId);
      await catatLog(
        `Menambah pengguna baru: ${nama_lengkap.trim()} (${peran})`,
        "pengguna",
        userId
      );
      revalidatePath("/users");
      return { success: true };
    }
    return { error: dbError.message };
  }

  await catatLog(
    `Menambah pengguna baru: ${nama_lengkap.trim()} (${peran})`,
    "pengguna",
    userId
  );
  revalidatePath("/users");
  return { success: true };
}

// ─────────────────────────────────────────────
// UPDATE role (Admin)
// ─────────────────────────────────────────────
export async function updateUserRole(
  id: string,
  peran: PeranPengguna,
  targetName?: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pengguna")
    .update({ peran })
    .eq("id", id);

  if (error) return { error: error.message };

  const label =
    peran === "admin"
      ? "Administrator"
      : peran === "petugas"
      ? "Petugas"
      : "Peminjam";
  await catatLog(
    `Mengubah peran pengguna${targetName ? ` ${targetName}` : ""} menjadi ${label}`,
    "pengguna",
    id
  );
  revalidatePath("/users");
  return { success: true };
}

// ─────────────────────────────────────────────
// UPDATE password (Admin reset password pengguna lain)
// ─────────────────────────────────────────────
export async function updateUserPassword(
  userId: string,
  newPassword: string,
  targetName?: string
) {
  if (!newPassword || newPassword.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { error: `Gagal mengubah password: ${error.message}` };
  }

  await catatLog(
    `Mereset password pengguna${targetName ? ` ${targetName}` : ""}`,
    "pengguna",
    userId
  );
  revalidatePath("/users");
  return { success: true };
}

// ─────────────────────────────────────────────
// UPDATE profile & password sendiri (User/Admin/Petugas)
// ─────────────────────────────────────────────
export async function updateSelfProfileAction(formData: FormData) {
  const nama_lengkap = formData.get("nama_lengkap") as string;
  const newPassword = formData.get("password") as string;

  const supabase = await createClient();
  const cookieStore = await cookies();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = cookieStore.get("user_id")?.value || user?.id;

  if (!userId) {
    return { error: "Sesi tidak ditemukan. Silakan login kembali." };
  }

  const updates: string[] = [];

  // Update nama jika diisi
  if (nama_lengkap && nama_lengkap.trim()) {
    const { error: nameErr } = await supabase
      .from("pengguna")
      .update({ nama_lengkap: nama_lengkap.trim() })
      .eq("id", userId);

    if (nameErr) {
      return { error: `Gagal memperbarui nama: ${nameErr.message}` };
    }
    updates.push("nama");
  }

  // Update password jika diisi
  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 6) {
      return { error: "Password minimal 6 karakter." };
    }

    const { error: pwErr } = await supabase.auth.updateUser({
      password: newPassword.trim(),
    });

    if (pwErr) {
      try {
        await supabase.auth.admin.updateUserById(userId, {
          password: newPassword.trim(),
        });
        updates.push("password");
      } catch {
        return { error: `Gagal memperbarui password: ${pwErr.message}` };
      }
    } else {
      updates.push("password");
    }
  }

  if (updates.length === 0) {
    return { error: "Tidak ada perubahan yang disimpan." };
  }

  const aksiKet = updates.includes("password")
    ? updates.includes("nama")
      ? "Memperbarui data profil dan mengganti password"
      : "Mengganti password akun"
    : `Memperbarui nama profil menjadi "${nama_lengkap.trim()}"`;

  await catatLog(aksiKet, "pengguna", userId);

  revalidatePath("/", "layout");
  return { success: true, nama_lengkap: nama_lengkap?.trim() };
}

// ─────────────────────────────────────────────
// DELETE user
// ─────────────────────────────────────────────
export async function deleteUser(id: string, targetName?: string) {
  const supabase = await createClient();

  // Lepaskan referensi foreign key agar tidak terblokir saat menghapus pengguna
  await supabase.from("log_aktivitas").update({ pengguna_id: null }).eq("pengguna_id", id);
  await supabase.from("peminjaman").update({ disetujui_oleh: null }).eq("disetujui_oleh", id);
  await supabase.from("pengembalian").update({ diverifikasi_oleh: null }).eq("diverifikasi_oleh", id);

  const { error } = await supabase.from("pengguna").delete().eq("id", id);

  if (error) return { error: error.message };

  // Hapus juga dari Supabase Auth jika memiliki akses admin
  try {
    await supabase.auth.admin.deleteUser(id);
  } catch {
    // Abaikan jika tidak menggunakan service role key
  }

  await catatLog(
    `Menghapus pengguna${targetName ? ` ${targetName}` : ""}`,
    "pengguna",
    id
  );
  revalidatePath("/users");
  return { success: true };
}
