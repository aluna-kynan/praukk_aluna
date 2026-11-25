"use server";

import { createClient } from "@/lib/supabase/server";

export async function getReportDataAction(startDate?: string, endDate?: string) {
  const supabase = await createClient();

  const startIso = startDate
    ? startDate.includes("T") ? startDate : `${startDate}T00:00:00`
    : undefined;
  const endIso = endDate
    ? endDate.includes("T") ? endDate : `${endDate}T23:59:59.999`
    : undefined;

  let loansQuery = supabase
    .from("peminjaman")
    .select(`
      *,
      alat:alat_id (nama),
      peminjam:peminjam_id (nama_lengkap),
      pengembalian:pengembalian (*)
    `)
    .order("diajukan_pada", { ascending: false });

  if (startIso) {
    loansQuery = loansQuery.gte("diajukan_pada", startIso);
  }
  if (endIso) {
    loansQuery = loansQuery.lte("diajukan_pada", endIso);
  }

  const { data: loans } = await loansQuery;

  let returnsQuery = supabase
    .from("pengembalian")
    .select(`
      *,
      peminjaman:peminjaman_id (
        id,
        jumlah,
        alat:alat_id (nama),
        peminjam:peminjam_id (nama_lengkap)
      )
    `)
    .order("dikembalikan_pada", { ascending: false });

  if (startIso) {
    returnsQuery = returnsQuery.gte("dikembalikan_pada", startIso);
  }
  if (endIso) {
    returnsQuery = returnsQuery.lte("dikembalikan_pada", endIso);
  }

  const { data: returns } = await returnsQuery;

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
