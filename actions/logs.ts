"use server";

import { createClient } from "@/lib/supabase/server";

export async function getLogsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("log_aktivitas")
    .select(`
      *,
      pengguna:pengguna_id (nama_lengkap, peran)
    `)
    .order("dibuat_pada", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
  return data || [];
}
