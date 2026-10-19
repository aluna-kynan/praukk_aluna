"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserAction } from "@/actions/auth";

export async function getLoansAction(filterStatus?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("peminjaman")
    .select(`
      *,
      alat:alat_id (id, nama, stok_tersedia, stok_total, kondisi),
      peminjam:peminjam_id (id, nama_lengkap, peran),
      pengembalian:pengembalian (*)
    `);

  if (filterStatus) {
    query = query.eq("status", filterStatus as any);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching loans:", error);
    return [];
  }
  return data || [];
}

export async function requestLoanAction(p_alat_id: string, p_jumlah: number, p_tanggal_jatuh_tempo?: string) {
  if (!p_alat_id || p_jumlah <= 0) {
    return { error: "Semua input peminjaman wajib valid." };
  }

  let dueDate = p_tanggal_jatuh_tempo;
  if (!dueDate) {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    dueDate = d.toISOString().split("T")[0];
  }

  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    return { error: "Anda harus login terlebih dahulu." };
  }

  const supabase = await createClient();

  // Try RPC `fn_ajukan_peminjaman`
  const { data: rpcData, error: rpcError } = await supabase.rpc("fn_ajukan_peminjaman", {
    p_alat_id,
    p_jumlah,
    p_tanggal_jatuh_tempo: dueDate,
  });

  if (!rpcError) {
    revalidatePath("/my-loans");
    revalidatePath("/tools");
    return { success: true, loanId: rpcData };
  }

  const borrowerId = currentUser.id;
  
  // Check stock available
  const { data: tool } = await supabase.from("alat").select("stok_tersedia").eq("id", p_alat_id).single();
  if (!tool || tool.stok_tersedia < p_jumlah) {
    return { error: "Stok alat tidak mencukupi." };
  }

  // Insert loan without decrementing stock (stock decrements upon approval)
  const { data: newLoan, error: insertError } = await supabase
    .from("peminjaman")
    .insert({
      peminjam_id: borrowerId,
      alat_id: p_alat_id,
      jumlah: p_jumlah,
      status: "diajukan",
      tanggal_jatuh_tempo: dueDate,
    })
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/my-loans");
  revalidatePath("/tools");
  return { success: true, loanId: newLoan.id };
}

export async function approveLoanAction(loanId: string) {
  const supabase = await createClient();

  const { error: rpcError } = await supabase.rpc("fn_setujui_peminjaman", {
    p_peminjaman_id: loanId,
  });

  if (!rpcError) {
    revalidatePath("/approvals");
    revalidatePath("/monitoring");
    return { success: true };
  }

  // Fallback direct update: Check stock, decrement stock, and set status to disetujui
  const { data: loan } = await supabase
    .from("peminjaman")
    .select("alat_id, jumlah, status")
    .eq("id", loanId)
    .single();

  if (!loan || loan.status !== "diajukan") {
    return { error: "Pengajuan tidak ditemukan atau sudah diproses." };
  }

  const { data: tool } = await supabase
    .from("alat")
    .select("stok_tersedia")
    .eq("id", loan.alat_id)
    .single();

  if (!tool || tool.stok_tersedia < loan.jumlah) {
    return { error: "Stok alat tidak mencukupi untuk menyetujui peminjaman ini." };
  }

  // Decrement stock upon approval
  await supabase
    .from("alat")
    .update({ stok_tersedia: tool.stok_tersedia - loan.jumlah })
    .eq("id", loan.alat_id);

  // Update loan status
  const { error } = await supabase
    .from("peminjaman")
    .update({
      status: "disetujui",
      tanggal_pinjam: new Date().toISOString(),
    })
    .eq("id", loanId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/approvals");
  revalidatePath("/monitoring");
  return { success: true };
}

export async function rejectLoanAction(loanId: string) {
  const supabase = await createClient();

  const { error: rpcError } = await supabase.rpc("fn_tolak_peminjaman", {
    p_peminjaman_id: loanId,
  });

  if (!rpcError) {
    revalidatePath("/approvals");
    return { success: true };
  }

  // Direct update status to ditolak (no stock release needed since stock was not decremented on request)
  const { error } = await supabase
    .from("peminjaman")
    .update({ status: "ditolak" })
    .eq("id", loanId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/approvals");
  return { success: true };
}
