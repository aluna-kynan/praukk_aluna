"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { KondisiAlat, StatusPembayaranDenda } from "@/types/database.types";
import { createLogAction } from "@/actions/logs";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

const RETURN_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "returns");

export interface ProcessReturnParams {
  kondisi_setelah: KondisiAlat;
  denda_kerusakan?: number;
  status_pembayaran?: StatusPembayaranDenda;
  catatan?: string;
  foto_url?: string;
}

export async function uploadReturnPhotoAction(formData: FormData) {
  const file = formData.get("file") as File | null;
  const peminjamanId = (formData.get("peminjaman_id") as string) || "ret";

  if (!file || file.size === 0) {
    return { error: "File foto tidak ditemukan." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (
    buffer.length < 12 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return { error: "Format foto harus berupa WebP yang valid." };
  }

  await mkdir(RETURN_UPLOAD_DIR, { recursive: true });
  const safeId = peminjamanId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16) || "ret";
  const filename = `${safeId}-${Date.now()}.webp`;
  await writeFile(path.join(RETURN_UPLOAD_DIR, filename), buffer);

  return { url: `/uploads/returns/${filename}` };
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
    .select("*, alat:alat_id(id, nama, stok_tersedia)")
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
    if (params.foto_url) {
      await supabase
        .from("pengembalian")
        .update({ foto_url: params.foto_url } as any)
        .eq("peminjaman_id", peminjaman_id);
    }

    await createLogAction(
      `Pengembalian alat diproses: ${loan.alat?.nama || "Alat"} (${loan.jumlah} unit)`,
      "pengembalian",
      peminjaman_id
    );

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

  // 3. Fallback direct logic jika RPC gagal/beda signature
  console.warn("RPC fn_proses_pengembalian fallback direct DB:", rpcError.message);

  let returnInsertResult = await supabase.from("pengembalian").insert({
    peminjaman_id,
    kondisi_setelah: kondisi,
    denda_keterlambatan: dendaTelat,
    denda_kerusakan: dendaKerusakanInput,
    jumlah_denda: totalDenda,
    status_pembayaran: statusBayar,
    catatan: catatanInput,
    ...(params.foto_url ? { foto_url: params.foto_url } : {}),
  } as any);

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

  await createLogAction(
    `Pengembalian alat diproses: ${loan.alat?.nama || "Alat"} (${loan.jumlah} unit)`,
    "pengembalian",
    peminjaman_id
  );

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

// ─────────────────────────────────────────────
// Pengajuan Pengembalian oleh Siswa (Peminjam)
// Hanya menandai "ingin dikembalikan" - petugas yang verifikasi fisik & proses actual return
// -----------------------------------------------------
export async function submitReturnByStudentAction(
  peminjaman_id: string,
  catatan?: string
) {
  const supabase = await createClient();

  const { data: loan, error: loanFetchError } = await supabase
    .from("peminjaman")
    .select("*, alat:alat_id(id, nama)")
    .eq("id", peminjaman_id)
    .single();

  if (loanFetchError || !loan) {
    return { error: "Data peminjaman tidak ditemukan." };
  }

  if (loan.status !== "disetujui" && loan.status !== "terlambat") {
    return { error: "Peminjaman ini tidak dalam status aktif dipinjam." };
  }

  // Cek apakah sudah pernah diajukan
  if ((loan as any).pengajuan_pengembalian_pada) {
    return { error: "Pengajuan pengembalian sudah dikirim. Tunggu konfirmasi petugas." };
  }

  // HANYA tandai kolom pengajuan � JANGAN ubah status, JANGAN insert pengembalian, JANGAN kembalikan stok
  const { error: updateError } = await supabase
    .from("peminjaman")
    .update({
      pengajuan_pengembalian_pada: new Date().toISOString(),
      catatan_peminjam: catatan?.trim() || null,
    } as any)
    .eq("id", peminjaman_id);

  if (updateError) {
    return { error: "Gagal mengirim pengajuan: " + updateError.message };
  }

  await createLogAction(
    `Siswa mengajukan pengembalian: ${loan.alat?.nama || "Alat"} (${loan.jumlah} unit)`,
    "peminjaman",
    peminjaman_id
  );

  revalidatePath("/my-loans");
  revalidatePath("/monitoring");

  return { success: true };
}
export async function settleFineAction(pengembalian_id: string) {
  const supabase = await createClient();

  // Coba via RPC `fn_lunasi_denda`
  const { error: rpcError } = await supabase.rpc("fn_lunasi_denda", {
    p_pengembalian_id: pengembalian_id,
  });

  if (!rpcError) {
    await createLogAction("Pelunasan denda pengembalian", "pengembalian", pengembalian_id);
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

  await createLogAction("Pelunasan denda pengembalian", "pengembalian", pengembalian_id);
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
