"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { History, ArrowRight, ArrowLeftRight, Loader2, AlertCircle, CheckCircle2, Eye, X, Package, Calendar, FileText, AlertTriangle, Clock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getLoansAction } from "@/actions/loans";
import { requestReturnAction } from "@/actions/returns";
import { 
  getStatusBadgeInfo, 
  getKondisiBadgeInfo, 
  getStatusPembayaranBadgeInfo, 
  formatRupiah 
} from "@/lib/status-mapper";

export default function MyLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoan, setDetailLoan] = useState<any | null>(null);
  const [requestingReturnId, setRequestingReturnId] = useState<string | null>(null);
  const [returnActionMessage, setReturnActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const getReturnData = useCallback((loan: any) => {
    if (!loan?.pengembalian) return null;
    return Array.isArray(loan.pengembalian) ? loan.pengembalian[0] : loan.pengembalian;
  }, []);

  const getDisplayStatus = useCallback((loan: any) => {
    return loan.status_pengembalian === "menunggu_verifikasi"
      ? "pengembalian_diajukan"
      : loan.status;
  }, []);

  const getDaysLate = useCallback((dueDateStr: string): number => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  const getDendaBreakdown = useCallback((ret: any) => {
    if (!ret) return { dendaTelat: 0, dendaRusak: 0, totalDenda: 0 };
    const totalDenda = Number(ret.jumlah_denda) || 0;
    let dendaTelat = Number(ret.denda_keterlambatan) || 0;
    let dendaRusak = Number(ret.denda_kerusakan) || 0;

    if (totalDenda > 0 && dendaTelat === 0 && dendaRusak === 0) {
      if (ret.kondisi_setelah === "baik") {
        dendaTelat = totalDenda;
        dendaRusak = 0;
      } else {
        dendaRusak = totalDenda;
        dendaTelat = 0;
      }
    }

    return { dendaTelat, dendaRusak, totalDenda };
  }, []);

  const loadLoans = async () => {
    setLoading(true);
    const data = await getLoansAction();
    setLoans(data || []);
    setLoading(false);
  };

  const handleRequestReturn = async (loanId: string) => {
    setRequestingReturnId(loanId);
    setReturnActionMessage(null);

    try {
      const result = await requestReturnAction(loanId);
      if (result.error) {
        setReturnActionMessage({ text: result.error, type: "error" });
        return;
      }

      setReturnActionMessage({ text: "Pengajuan pengembalian berhasil dikirim ke petugas.", type: "success" });
      await loadLoans();
    } finally {
      setRequestingReturnId(null);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  // Hitung total tunggakan denda peminjam jika ada
  const totalTunggakan = useMemo(() => {
    return loans.reduce((acc, loan) => {
      const ret = loan.pengembalian;
      if (ret && ret.status_pembayaran === "belum_lunas") {
        return acc + (Number(ret.jumlah_denda) || 0);
      }
      return acc;
    }, 0);
  }, [loans]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Riwayat Peminjaman Saya</h1>
          <p className="text-muted-foreground mt-1">Pantau status pengajuan, jatuh tempo, pengembalian alat, dan status denda.</p>
        </div>
        <Link href="/tools" className={buttonVariants({ className: "bg-primary shadow-sm" })}>
          Pinjam Alat Baru <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* Banner Peringatan Tunggakan Denda jika ada */}
      {totalTunggakan > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-semibold">Anda memiliki denda tertunggak sebesar {formatRupiah(totalTunggakan)}</p>
              <p className="text-xs text-rose-600/90">
                Silakan lakukan pelunasan denda ke petugas inventaris di laboratorium atau ruang administrasi.
              </p>
            </div>
          </div>
        </div>
      )}

      {returnActionMessage && (
        <div
          role={returnActionMessage.type === "error" ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            returnActionMessage.type === "error"
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
          }`}
        >
          {returnActionMessage.text}
        </div>
      )}

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            Daftar Peminjaman Saya
          </CardTitle>
          <CardDescription>Klik baris mana saja untuk melihat pratinjau detail lengkap transaksi & denda.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data peminjaman...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Alat</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tgl Pengajuan</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Kondisi & Denda</TableHead>
                  <TableHead>Status Denda</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length > 0 ? (
                  loans.map((loan) => {
                    const statusInfo = getStatusBadgeInfo(getDisplayStatus(loan));
                    const ret = getReturnData(loan);
                    const fineTotal = ret ? Number(ret.jumlah_denda) || 0 : 0;
                    const fineStatus = ret?.status_pembayaran || (fineTotal > 0 ? "belum_lunas" : "lunas");
                    const fineStatusInfo = getStatusPembayaranBadgeInfo(fineStatus);

                    return (
                      <TableRow 
                        key={loan.id} 
                        className="hover:bg-muted/40 cursor-pointer transition-colors group"
                        onClick={() => setDetailLoan(loan)}
                      >
                        <TableCell className="font-medium">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {loan.alat?.nama || "Alat"}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">{loan.id}</span>
                        </TableCell>
                        <TableCell>{loan.jumlah} unit</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {loan.diajukan_pada ? new Date(loan.diajukan_pada).toLocaleDateString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium text-xs">
                          {loan.tanggal_jatuh_tempo ? new Date(loan.tanggal_jatuh_tempo).toLocaleDateString("id-ID") : "-"}
                        </TableCell>

                        {/* Kondisi Pengembalian & Nominal Denda */}
                        <TableCell>
                          {ret ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className={getKondisiBadgeInfo(ret.kondisi_setelah).className}>
                                {getKondisiBadgeInfo(ret.kondisi_setelah).label}
                              </Badge>
                              {fineTotal > 0 ? (
                                <div className="text-xs font-semibold text-rose-600">
                                  {formatRupiah(fineTotal)}
                                </div>
                              ) : (
                                <span className="text-xs text-emerald-600 font-medium">Bebas Denda</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Belum dikembalikan</span>
                          )}
                        </TableCell>

                        {/* Status Pembayaran Denda */}
                        <TableCell>
                          {ret ? (
                            <div className="space-y-0.5">
                              <Badge variant="outline" className={fineStatusInfo.className}>
                                {fineStatusInfo.label}
                              </Badge>
                              {ret.catatan && (
                                <div className="text-[10px] text-muted-foreground max-w-[150px] truncate" title={ret.catatan}>
                                  {ret.catatan}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {loan.status_pengembalian === "menunggu_verifikasi" ? (
                            <span className="mr-2 text-xs font-medium text-amber-600">Menunggu verifikasi</span>
                          ) : (loan.status === "disetujui" || loan.status === "terlambat") && loan.status_pengembalian == null ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mr-1 h-8 border-primary text-primary hover:bg-primary/10"
                              disabled={requestingReturnId === loan.id}
                              onClick={() => handleRequestReturn(loan.id)}
                            >
                              {requestingReturnId === loan.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Ajukan Pengembalian
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            onClick={() => setDetailLoan(loan)}
                            title="Lihat Pratinjau Detail"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2 py-6">
                        <History className="h-8 w-8 text-muted-foreground/30" />
                        <p>Belum ada riwayat peminjaman terdaftar.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Preview Detail Peminjaman Saya */}
      {detailLoan && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDetailLoan(null)}
        >
          <Card 
            className="w-full max-w-lg shadow-2xl border-border/80 max-h-[90vh] flex flex-col overflow-hidden bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b bg-muted/30 pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Detail Peminjaman
                  </CardTitle>
                  <Badge variant="outline" className={getStatusBadgeInfo(getDisplayStatus(detailLoan)).className}>
                    {getStatusBadgeInfo(getDisplayStatus(detailLoan)).label}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  ID Transaksi: <span className="font-mono font-medium text-foreground">{detailLoan.id}</span>
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full hover:bg-muted" 
                onClick={() => setDetailLoan(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="overflow-y-auto p-5 space-y-4 text-sm">
              {/* Info Alat */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Package className="h-3.5 w-3.5 text-primary" /> Alat yang Dipinjam
                </div>
                <div className="text-base font-bold text-foreground">
                  {detailLoan.alat?.nama || "Alat"}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Jumlah: <strong className="text-foreground">{detailLoan.jumlah} unit</strong></span>
                  {detailLoan.alat?.kondisi && (
                    <Badge variant="outline" className={getKondisiBadgeInfo(detailLoan.alat.kondisi).className}>
                      Kondisi: {getKondisiBadgeInfo(detailLoan.alat.kondisi).label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Jadwal Waktu */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/10 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Jadwal Peminjaman
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-background border border-border/50">
                    <span className="text-muted-foreground block text-[11px]">Tanggal Pengajuan</span>
                    <span className="font-semibold text-foreground">
                      {detailLoan.diajukan_pada || detailLoan.created_at
                        ? new Date(detailLoan.diajukan_pada || detailLoan.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                        : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border/50">
                    <span className="text-muted-foreground block text-[11px]">Jatuh Tempo</span>
                    <span className="font-semibold text-foreground">
                      {detailLoan.tanggal_jatuh_tempo
                        ? new Date(detailLoan.tanggal_jatuh_tempo).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                        : "-"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border/50 col-span-2 sm:col-span-1">
                    <span className="text-muted-foreground block text-[11px]">Tanggal Kembali</span>
                    <span className="font-semibold text-foreground">
                      {getReturnData(detailLoan)?.dikembalikan_pada
                        ? new Date(getReturnData(detailLoan).dikembalikan_pada).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Pengembalian & Denda */}
              {(() => {
                const ret = getReturnData(detailLoan);
                if (ret) {
                  const fineTotal = Number(ret.jumlah_denda) || 0;
                  const fineStatus = ret.status_pembayaran || (fineTotal > 0 ? "belum_lunas" : "lunas");
                  const fineInfo = getStatusPembayaranBadgeInfo(fineStatus);
                  const { dendaTelat, dendaRusak } = getDendaBreakdown(ret);

                  return (
                    <div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <FileText className="h-3.5 w-3.5 text-primary" /> Rincian Pengembalian & Denda
                        </div>
                        <Badge variant="outline" className={getKondisiBadgeInfo(ret.kondisi_setelah).className}>
                          Fisik: {getKondisiBadgeInfo(ret.kondisi_setelah).label}
                        </Badge>
                      </div>

                      <div className="divide-y divide-border/50 text-xs">
                        <div className="flex justify-between py-1.5">
                          <span className="text-muted-foreground">Denda Keterlambatan</span>
                          <span className="font-semibold text-foreground">{formatRupiah(dendaTelat)}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-muted-foreground">Denda Kerusakan Fisik</span>
                          <span className="font-semibold text-foreground">{formatRupiah(dendaRusak)}</span>
                        </div>
                        <div className="flex justify-between py-2 items-center bg-muted/30 px-2 rounded-md my-1">
                          <span className="font-bold text-foreground">Total Denda</span>
                          <span className={`font-bold text-base ${fineTotal > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            {formatRupiah(fineTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 items-center">
                          <span className="text-muted-foreground">Status Pembayaran</span>
                          <Badge variant="outline" className={fineInfo.className}>
                            {fineInfo.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                        <span className="text-muted-foreground block text-[11px] font-semibold">Catatan dari Petugas:</span>
                        <p className="mt-0.5 font-medium text-foreground italic">
                          {ret.catatan ? `"${ret.catatan}"` : "Tidak ada catatan khusus."}
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  if (detailLoan.status_pengembalian === "menunggu_verifikasi") {
                    return (
                      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
                          <Clock className="h-3.5 w-3.5" /> Menunggu Verifikasi Petugas
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Pengajuan pengembalian sudah dikirim. Petugas akan memeriksa kondisi alat sebelum pengembalian dinyatakan selesai.
                        </p>
                        {detailLoan.pengembalian_diajukan_pada && (
                          <p className="text-[11px] text-muted-foreground">
                            Diajukan pada {new Date(detailLoan.pengembalian_diajukan_pada).toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                    );
                  }

                  const daysLate = getDaysLate(detailLoan.tanggal_jatuh_tempo);
                  const estLateFine = daysLate * 5000 * Number(detailLoan.jumlah || 1);

                  return (
                    <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> Status Peminjaman Aktif
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Alat ini sedang Anda gunakan. Harap jaga kondisi fisik alat dan kembalikan tepat waktu sebelum tanggal jatuh tempo.
                      </p>
                      {daysLate > 0 ? (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Peminjaman terlambat {daysLate} hari!</span>
                            <p className="text-[11px] text-rose-600/90 mt-0.5">
                              Estimasi denda keterlambatan berjalan: <strong>{formatRupiah(estLateFine)}</strong> (Rp 5.000 x {detailLoan.jumlah} unit x {daysLate} hari). Segera kembalikan alat ke laboratorium.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Peminjaman masih dalam batas waktu aktif.</span>
                        </div>
                      )}
                    </div>
                  );
                }
              })()}
            </CardContent>

            <CardFooter className="border-t bg-muted/20 flex justify-end gap-2 p-3">
              <Button variant="outline" size="sm" onClick={() => setDetailLoan(null)}>
                Tutup
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
