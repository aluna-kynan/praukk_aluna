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

export async function processReturnAction(
  peminjaman_id: string,
  paramsOrKondisi: KondisiAlat | ProcessReturnParams
) {
  const supabase = await createClient();

  // Normalize parameters (backward compatible if only string kondisi passed)
  const params: ProcessReturnParams =
    typeof paramsOrKondisi === "string"
      ? { kondisi_setelah: paramsOrKondisi }
      : paramsOrKondisi;

  const kondisi = params.kondisi_setelah;
  const dendaKerusakanInput = kondisi === "baik" ? 0 : Math.max(0, Number(params.denda_kerusakan) || 0);
  const catatanInput = params.catatan?.trim() || null;

  // 1. Ambil data peminjaman untuk perhitungan denda keterlambatan (qty-aware)
  const { data: loan, error: loanFetchError } = await supabase
    .from("peminjaman")
    .select("*, alat:alat_id(id, stok_tersedia)")
    .eq("id", peminjaman_id)
    .single();

  if (loanFetchError || !loan) {
    return { error: "Peminjaman tidak ditemukan atau data korup." };
  }

  // Hitung keterlambatan (Rp 5.000 / hari / unit)
  const dueDate = new Date(loan.tanggal_jatuh_tempo);
  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
  const loanQty = Number(loan.jumlah) || 1;
  const dendaTelat = diffDays * 5000 * loanQty;
  const totalDenda = dendaTelat + dendaKerusakanInput;

  // Tentukan status pembayaran
  let statusBayar: StatusPembayaranDenda = "lunas";
  if (totalDenda > 0) {
    statusBayar = params.status_pembayaran || "lunas";
  }

  // 2. Coba jalankan lewat Stored Function PostgreSQL RPC (atomic & transaction-safe)
  const { error: rpcError } = await supabase.rpc("fn_proses_pengembalian", {
    p_peminjaman_id: peminjaman_id,
    p_kondisi: kondisi,
    p_denda_kerusakan: dendaKerusakanInput,
    p_status_pembayaran: statusBayar,
    p_catatan: catatanInput,
  });

  if (!rpcError) {
    revalidatePath("/monitoring");
    revalidatePath("/my-loans");
    revalidatePath("/reports");
    return {
      success: true,
      dendaTelat,
      dendaKerusakan: dendaKerusakanInput,
      totalDenda,
      statusBayar,
    };
  }

  // 3. Fallback direct logic jika RPC belum diperbarui di remote Supabase
  console.warn("RPC fn_proses_pengembalian gagal/beda signature, menggunakan fallback direct DB:", rpcError.message);

  // Coba insert dengan skema baru lengkap
  let returnInsertResult = await supabase.from("pengembalian").insert({
    peminjaman_id,
    kondisi_setelah: kondisi,
    denda_keterlambatan: dendaTelat,
    denda_kerusakan: dendaKerusakanInput,
    jumlah_denda: totalDenda,
    status_pembayaran: statusBayar,
    catatan: catatanInput,
  });

  // Jika gagal karena kolom baru belum di-alter di Supabase user, fallback ke kolom dasar
  if (returnInsertResult.error) {
    console.warn("Fallback ke skema pengembalian standar:", returnInsertResult.error.message);
    const basicInsert = await supabase.from("pengembalian").insert({
      peminjaman_id,
      kondisi_setelah: kondisi,
      jumlah_denda: totalDenda,
    });

    if (basicInsert.error) {
      return { error: basicInsert.error.message };
    }
  }

  // Update status peminjaman menjadi 'dikembalikan'
  await supabase
    .from("peminjaman")
    .update({ status: "dikembalikan" })
    .eq("id", peminjaman_id);

  // Kembalikan stok alat
  if (loan.alat) {
    await supabase
      .from("alat")
      .update({ stok_tersedia: loan.alat.stok_tersedia + loan.jumlah })
      .eq("id", loan.alat.id);
  }

  revalidatePath("/monitoring");
  revalidatePath("/my-loans");
  revalidatePath("/reports");

  return {
    success: true,
    dendaTelat,
    dendaKerusakan: dendaKerusakanInput,
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
