"use server";

import { createClient } from "@/lib/supabase/server";

export async function getReportDataAction(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  let loansQuery = supabase
    .from("peminjaman")
    .select(`
      *,
      alat:alat_id (nama),
      peminjam:peminjam_id (nama_lengkap)
    `)
    .order("diajukan_pada", { ascending: false });

  if (startDate) {
    loansQuery = loansQuery.gte("diajukan_pada", startDate);
  }
  if (endDate) {
    loansQuery = loansQuery.lte("diajukan_pada", endDate);
  }

  const { data: loans, error: loansError } = await loansQuery;

  let returnsQuery = supabase
    .from("pengembalian")
    .select(`
      *,
      peminjaman:peminjaman_id (
        id,
        alat:alat_id (nama),
        peminjam:peminjam_id (nama_lengkap)
      )
    `)
    .order("dikembalikan_pada", { ascending: false });

  if (startDate) {
    returnsQuery = returnsQuery.gte("dikembalikan_pada", startDate);
  }
  if (endDate) {
    returnsQuery = returnsQuery.lte("dikembalikan_pada", endDate);
  }

  const { data: returns, error: returnsError } = await returnsQuery;

  const returnsList = returns || [];
  const totalDenda = returnsList.reduce((acc, curr) => acc + (Number(curr.jumlah_denda) || 0), 0);
  const totalDendaLunas = returnsList
    .filter((r) => r.status_pembayaran === "lunas" || !r.status_pembayaran)
    .reduce((acc, curr) => acc + (Number(curr.jumlah_denda) || 0), 0);
  const totalDendaTertunggak = returnsList
    .filter((r) => r.status_pembayaran === "belum_lunas")
    .reduce((acc, curr) => acc + (Number(curr.jumlah_denda) || 0), 0);
  const totalDendaTelat = returnsList.reduce((acc, curr) => acc + (Number(curr.denda_keterlambatan) || 0), 0);
  const totalDendaKerusakan = returnsList.reduce((acc, curr) => acc + (Number(curr.denda_kerusakan) || 0), 0);

  return {
    loans: loans || [],
    returns: returnsList,
    totalLoans: loans?.length || 0,
    totalReturns: returnsList.length,
    totalDenda,
    totalDendaLunas,
    totalDendaTertunggak,
    totalDendaTelat,
    totalDendaKerusakan,
  };
}
