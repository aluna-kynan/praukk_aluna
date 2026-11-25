"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getLogsAction() {
  const supabase = await createClient();

  // Coba urutkan berdasarkan created_at terlebih dahulu
  let { data, error } = await supabase
    .from("log_aktivitas")
    .select(`
      *,
      pengguna:pengguna_id (nama_lengkap, peran)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fallback jika nama kolom adalah dibuat_pada
  if (error) {
    const fallback = await supabase
      .from("log_aktivitas")
      .select(`
        *,
        pengguna:pengguna_id (nama_lengkap, peran)
      `)
      .order("dibuat_pada", { ascending: false })
      .limit(50);
    data = fallback.data;
  }
  return data || [];
}

export async function createLogAction(
  aksi: string,
  tabel?: string,
  idTarget?: string
) {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = cookieStore.get("user_id")?.value || user?.id || null;

    const payload: Record<string, any> = {
      aksi,
      tabel_target: tabel || null,
      id_target: idTarget || null,
    };
    if (userId) {
      payload.pengguna_id = userId;
    }

    const { error } = await supabase.from("log_aktivitas").insert(payload);
    if (error) {
      await supabase.rpc("fn_catat_log", {
        p_aksi: aksi,
        p_tabel_target: tabel || null,
        p_id_target: idTarget || null,
      });
    }
  } catch (e) {
    console.error("createLogAction error:", e);
  }
}
