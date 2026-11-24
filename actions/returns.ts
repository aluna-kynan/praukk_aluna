"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { KondisiAlat, StatusPembayaranDenda } from "@/types/database.types";

export interface ProcessReturnParams {
  kondisi_setelah: KondisiAlat;
  denda_kerusakan?: number;
  status_pembayaran?: StatusPembayaranDenda;
  catatan?: string;
}

export async function requestReturnAction(peminjaman_id: string) {
  if (typeof peminjaman_id !== "string" || !peminjaman_id.trim()) {
    return { error: "ID peminjaman tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_ajukan_pengembalian", {
    p_peminjaman_id: peminjaman_id.trim(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/my-loans");
  revalidatePath("/monitoring");
  return { success: true };
}

export async function processReturnAction(
  peminjaman_id: string,
  paramsOrKondisi: KondisiAlat | ProcessReturnParams
) {
  if (typeof peminjaman_id !== "string" || !peminjaman_id.trim()) {
    return { error: "ID peminjaman tidak valid." };
  }
  if (
    paramsOrKondisi == null ||
    (typeof paramsOrKondisi !== "string" && typeof paramsOrKondisi !== "object")
  ) {
    return { error: "Data pemeriksaan pengembalian tidak valid." };
  }

  const supabase = await createClient();

  const params: ProcessReturnParams =
    typeof paramsOrKondisi === "string"
      ? { kondisi_setelah: paramsOrKondisi }
      : paramsOrKondisi;

  if (params.catatan != null && typeof params.catatan !== "string") {
    return { error: "Catatan pemeriksaan tidak valid." };
  }

  const kondisi = params.kondisi_setelah;
  if (!["baik", "rusak_ringan", "rusak_berat"].includes(kondisi)) {
    return { error: "Kondisi alat tidak valid." };
  }

  const dendaKerusakanInput = Number(params.denda_kerusakan ?? 0);
  if (!Number.isFinite(dendaKerusakanInput) || dendaKerusakanInput < 0) {
    return { error: "Denda kerusakan harus berupa angka nol atau lebih." };
  }

  const allowedPaymentStatuses: StatusPembayaranDenda[] = ["lunas", "belum_lunas", "bebas_denda"];
  if (params.status_pembayaran && !allowedPaymentStatuses.includes(params.status_pembayaran)) {
    return { error: "Status pembayaran denda tidak valid." };
  }

  const normalizedDamageFine = kondisi === "baik" ? 0 : dendaKerusakanInput;
  const catatanInput = params.catatan?.trim() || null;

  const { data: loan, error: loanFetchError } = await supabase
    .from("peminjaman")
    .select("id, status, status_pengembalian, tanggal_jatuh_tempo, jumlah")
    .eq("id", peminjaman_id.trim())
    .single();

  if (loanFetchError) {
    return { error: loanFetchError.message };
  }
  if (!loan) {
    return { error: "Peminjaman tidak ditemukan atau data korup." };
  }
  if (loan.status_pengembalian !== "menunggu_verifikasi") {
    return { error: "Peminjam belum mengajukan pengembalian atau pengajuan sudah diproses." };
  }

  const dueDate = new Date(loan.tanggal_jatuh_tempo);
  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
  const loanQty = Number(loan.jumlah) || 1;
  const dendaTelat = diffDays * 5000 * loanQty;
  const totalDenda = dendaTelat + normalizedDamageFine;

  let statusBayar: StatusPembayaranDenda = "lunas";
  if (totalDenda > 0) {
    statusBayar = params.status_pembayaran || "lunas";
  }

  const { error: rpcError } = await supabase.rpc("fn_proses_pengembalian", {
    p_peminjaman_id: peminjaman_id.trim(),
    p_kondisi: kondisi,
    p_denda_kerusakan: normalizedDamageFine,
    p_status_pembayaran: statusBayar,
    p_catatan: catatanInput,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  revalidatePath("/monitoring");
  revalidatePath("/my-loans");
  revalidatePath("/reports");

  return {
    success: true,
    dendaTelat,
    dendaKerusakan: normalizedDamageFine,
    totalDenda,
    statusBayar,
  };
}

export async function settleFineAction(pengembalian_id: string) {
  const supabase = await createClient();

  // Coba via RPC `fn_lunasi_denda`
  const { error: rpcError } = await supabase.rpc("fn_lunasi_denda", {
    p_pengembalian_id: pengembalian_id,
  });

  if (!rpcError) {
    revalidatePath("/monitoring");
    revalidatePath("/my-loans");
    revalidatePath("/reports");
    return { success: true };
  }

  // Fallback direct update
  const { error: updateError } = await supabase
    .from("pengembalian")
    .update({ status_pembayaran: "lunas" })
    .eq("id", pengembalian_id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/monitoring");
  revalidatePath("/my-loans");
  revalidatePath("/reports");
  return { success: true };
}

export async function getReturnsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pengembalian")
    .select(`
      *,
      peminjaman:peminjaman_id (
        id, jumlah, status, tanggal_jatuh_tempo,
        alat:alat_id (nama),
        peminjam:peminjam_id (nama_lengkap)
      )
    `)
    .order("dikembalikan_pada", { ascending: false });

  if (error) {
    console.error("Error fetching returns:", error);
    return [];
  }
  return data || [];
}
