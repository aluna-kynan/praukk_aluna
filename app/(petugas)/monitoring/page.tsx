"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  Filter, 
  DollarSign, 
  CreditCard,
  Wrench,
  Check,
  Eye,
  FileCheck,
  X,
  User,
  Package,
  Calendar,
  FileText,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getLoansAction } from "@/actions/loans";
import { processReturnAction, settleFineAction } from "@/actions/returns";
import { 
  getStatusBadgeInfo, 
  getKondisiBadgeInfo, 
  getStatusPembayaranBadgeInfo, 
  formatRupiah 
} from "@/lib/status-mapper";
import { KondisiAlat, StatusPembayaranDenda } from "@/types/database.types";
import { TIME_FILTER_OPTIONS, isDateInFilter, TimeFilterOption } from "@/lib/date-utils";

export default function MonitoringPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("this_month");
  const [statusTab, setStatusTab] = useState<"all" | "dipinjam" | "dikembalikan" | "piutang">("all");

  // Return modal state
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [kondisiAfter, setKondisiAfter] = useState<KondisiAlat>("baik");
  const [dendaKerusakan, setDendaKerusakan] = useState<number>(0);
  const [dendaKerusakanDisplay, setDendaKerusakanDisplay] = useState<string>("");
  const [catatan, setCatatan] = useState<string>("");
  const [statusPembayaran, setStatusPembayaran] = useState<StatusPembayaranDenda>("lunas");
  const [isProcessing, setIsProcessing] = useState(false);
  const [returnMsg, setReturnMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Detail preview modal state (saat baris diklik)
  const [detailLoan, setDetailLoan] = useState<any | null>(null);

  // Settlement loading state
  const [settlingId, setSettlingId] = useState<string | null>(null);

  // Helper: Ambil data pengembalian secara konsisten (objek / array)
  const getReturnData = useCallback((loan: any) => {
    if (!loan?.pengembalian) return null;
    return Array.isArray(loan.pengembalian) ? loan.pengembalian[0] : loan.pengembalian;
  }, []);

  // Helper: Hitung selisih hari keterlambatan
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

  // Helper: Dapatkan breakdown denda yang konsisten & logis (termasuk untuk data legacy)
  const getDendaBreakdown = useCallback((ret: any) => {
    if (!ret) return { dendaTelat: 0, dendaRusak: 0, totalDenda: 0 };
    const totalDenda = Number(ret.jumlah_denda) || 0;
    let dendaTelat = Number(ret.denda_keterlambatan) || 0;
    let dendaRusak = Number(ret.denda_kerusakan) || 0;

    // Jika total denda > 0 tapi dendaTelat + dendaRusak masih 0 (data dibuat sebelum migrasi kolom):
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

  // Helper: format angka ke string titik ribuan (tanpa prefix Rp)
  const formatThousands = useCallback((num: number): string => {
    if (num === 0) return "";
    return num.toLocaleString("id-ID");
  }, []);

  // Helper: parse string titik ribuan kembali ke angka
  const parseRupiahInput = useCallback((value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, "");
    return Number(cleaned) || 0;
  }, []);

  // Helper: capitalize tiap awal kata
  const toTitleCase = useCallback((str: string): string => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getLoansAction();
    // Filter active or returned loans
    const filtered = (data || []).filter(
      (l) => l.status === "disetujui" || l.status === "dikembalikan" || l.status === "terlambat"
    );
    setLoans(filtered);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter based on date
  const dateFilteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const d = l.created_at || l.tanggal_pinjam || l.tanggal_jatuh_tempo;
      return isDateInFilter(d, timeFilter);
    });
  }, [loans, timeFilter]);

  // Filter based on tab
  const displayedLoans = useMemo(() => {
    if (statusTab === "dipinjam") {
      return dateFilteredLoans.filter((l) => l.status === "disetujui");
    }
    if (statusTab === "dikembalikan") {
      return dateFilteredLoans.filter((l) => l.status === "dikembalikan");
    }
    if (statusTab === "piutang") {
      return dateFilteredLoans.filter(
        (l) => l.status === "dikembalikan" && l.pengembalian?.status_pembayaran === "belum_lunas"
      );
    }
    return dateFilteredLoans;
  }, [dateFilteredLoans, statusTab]);

  // Aggregate stats
  const stats = useMemo(() => {
    const dipinjam = dateFilteredLoans.filter((l) => l.status === "disetujui").length;
    const dikembalikan = dateFilteredLoans.filter((l) => l.status === "dikembalikan").length;
    
    let totalDendaLunas = 0;
    let totalDendaTertunggak = 0;

    dateFilteredLoans.forEach((l) => {
      const ret = getReturnData(l);
      if (ret) {
        const denda = Number(ret.jumlah_denda) || 0;
        if (ret.status_pembayaran === "belum_lunas") {
          totalDendaTertunggak += denda;
        } else {
          totalDendaLunas += denda;
        }
      }
    });

    return { dipinjam, dikembalikan, totalDendaLunas, totalDendaTertunggak };
  }, [dateFilteredLoans, getReturnData]);

  // Real-time calculation for modal
  const liveCalculation = useMemo(() => {
    if (!selectedLoan) return { daysLate: 0, dendaTelat: 0, dendaRusak: 0, totalDenda: 0 };

    const dueDate = new Date(selectedLoan.tanggal_jatuh_tempo);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
    const qty = Number(selectedLoan.jumlah) || 1;
    const dendaTelat = diffDays * 5000 * qty;
    const dendaRusak = kondisiAfter === "baik" ? 0 : Math.max(0, Number(dendaKerusakan) || 0);
    const totalDenda = dendaTelat + dendaRusak;

    return {
      daysLate: diffDays,
      qty,
      dendaTelat,
      dendaRusak,
      totalDenda,
    };
  }, [selectedLoan, kondisiAfter, dendaKerusakan]);

  const handleOpenReturnModal = (loan: any) => {
    setSelectedLoan(loan);
    setKondisiAfter("baik");
    setDendaKerusakan(0);
    setDendaKerusakanDisplay("");
    setCatatan("");
    setStatusPembayaran("lunas");
    setReturnMsg(null);
    setShowPreview(false);
  };

  // Klik "Selesaikan" → buka preview dulu
  const handleShowPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
  };

  // Konfirmasi dari dialog preview → kirim ke server
  const handleConfirmSubmit = async () => {
    if (!selectedLoan) return;

    setIsProcessing(true);
    setReturnMsg(null);

    const res = await processReturnAction(selectedLoan.id, {
      kondisi_setelah: kondisiAfter,
      denda_kerusakan: dendaKerusakan,
      status_pembayaran: liveCalculation.totalDenda === 0 ? "lunas" : statusPembayaran,
      catatan,
    });

    if (res.error) {
      setShowPreview(false);
      setReturnMsg({ text: res.error, type: "error" });
    } else {
      setReturnMsg({ text: "Pengembalian berhasil diproses!", type: "success" });
      setShowPreview(false);
      setTimeout(() => {
        setSelectedLoan(null);
        setReturnMsg(null);
        loadData();
      }, 1200);
    }
    setIsProcessing(false);
  };

  const handleSettleFine = async (pengembalianId: string) => {
    setSettlingId(pengembalianId);
    const res = await settleFineAction(pengembalianId);
    if (res.success) {
      await loadData();
    } else {
      alert(res.error || "Gagal melunasi denda");
    }
    setSettlingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pemantauan Pengembalian & Denda</h1>
          <p className="text-muted-foreground mt-1">
            Pantau status alat, verifikasi fisik, hitung denda multi-komponen, dan kelola pelunasan denda.
          </p>
        </div>

        {/* Time Filter Select */}
        <div className="flex items-center gap-2 bg-card border border-border/60 p-2 rounded-xl shadow-sm">
          <Filter className="h-4 w-4 text-primary ml-1" />
          <span className="text-xs font-medium text-muted-foreground">Filter Waktu:</span>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value as TimeFilterOption)}
            className="h-9 px-3 rounded-lg bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border/60 cursor-pointer"
          >
            {TIME_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sedang Dipinjam</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.dipinjam} Transaksi</div>
            <p className="text-xs text-muted-foreground mt-1">Alat berstatus aktif di peminjam</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selesai Dikembalikan</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.dikembalikan} Transaksi</div>
            <p className="text-xs text-muted-foreground mt-1">Stok alat telah kembali ke gudang</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Denda Terkumpul</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatRupiah(stats.totalDendaLunas)}</div>
            <p className="text-xs text-muted-foreground mt-1">Denda berstatus lunas / tertagih</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Denda Tertunggak</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatRupiah(stats.totalDendaTertunggak)}</div>
            <p className="text-xs text-muted-foreground mt-1">Piutang denda belum dilunasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Daftar Transaksi Peminjaman & Pengembalian
            </CardTitle>
            <CardDescription>
              Klik baris mana saja untuk melihat pratinjau detail lengkap transaksi, status fisik, & denda.
            </CardDescription>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border/60">
            <Button
              size="sm"
              variant={statusTab === "all" ? "default" : "ghost"}
              className="h-7 text-xs px-2.5"
              onClick={() => setStatusTab("all")}
            >
              Semua ({dateFilteredLoans.length})
            </Button>
            <Button
              size="sm"
              variant={statusTab === "dipinjam" ? "default" : "ghost"}
              className="h-7 text-xs px-2.5"
              onClick={() => setStatusTab("dipinjam")}
            >
              Dipinjam ({stats.dipinjam})
            </Button>
            <Button
              size="sm"
              variant={statusTab === "dikembalikan" ? "default" : "ghost"}
              className="h-7 text-xs px-2.5"
              onClick={() => setStatusTab("dikembalikan")}
            >
              Dikembalikan ({stats.dikembalikan})
            </Button>
            <Button
              size="sm"
              variant={statusTab === "piutang" ? "destructive" : "ghost"}
              className={`h-7 text-xs px-2.5 ${statusTab !== "piutang" ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : ""}`}
              onClick={() => setStatusTab("piutang")}
            >
              Belum Lunas
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data monitoring dari Supabase...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Peminjam</TableHead>
                  <TableHead>Alat & Jumlah</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status Peminjaman</TableHead>
                  <TableHead>Kondisi & Denda</TableHead>
                  <TableHead>Status Pembayaran</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedLoans.length > 0 ? (
                  displayedLoans.map((loan) => {
                    const statusInfo = getStatusBadgeInfo(loan.status);
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
                            {loan.peminjam?.nama_lengkap || "Peminjam"}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">{loan.id}</span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{loan.alat?.nama || "Alat"}</div>
                          <span className="text-xs text-muted-foreground">{loan.jumlah} unit</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium text-xs">
                          {loan.tanggal_jatuh_tempo ? new Date(loan.tanggal_jatuh_tempo).toLocaleDateString("id-ID") : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusInfo.className}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>

                        {/* Kondisi & Rincian Denda */}
                        <TableCell>
                          {ret ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className={getKondisiBadgeInfo(ret.kondisi_setelah).className}>
                                {getKondisiBadgeInfo(ret.kondisi_setelah).label}
                              </Badge>
                              {fineTotal > 0 ? (
                                <div className="text-xs space-y-0.5">
                                  <div className="font-semibold text-rose-600">{formatRupiah(fineTotal)}</div>
                                  {(() => {
                                    const { dendaTelat, dendaRusak } = getDendaBreakdown(ret);
                                    return (
                                      <div className="text-[10px] text-muted-foreground">
                                        Telat: {formatRupiah(dendaTelat)} | Rusak: {formatRupiah(dendaRusak)}
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className="text-xs text-emerald-600 font-medium">Bebas Denda (Rp 0)</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </TableCell>

                        {/* Status Pembayaran */}
                        <TableCell>
                          {ret ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className={fineStatusInfo.className}>
                                {fineStatusInfo.label}
                              </Badge>
                              {ret.catatan && (
                                <div className="text-[10px] text-muted-foreground max-w-[140px] truncate" title={ret.catatan}>
                                  Catatan: {ret.catatan}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                              onClick={() => setDetailLoan(loan)}
                              title="Lihat Pratinjau Detail"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Detail
                            </Button>

                            {loan.status === "disetujui" ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 border-primary text-primary hover:bg-primary/10 shadow-sm"
                                onClick={() => handleOpenReturnModal(loan)}
                              >
                                <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" /> Proses Kembali
                              </Button>
                            ) : ret && fineStatus === "belum_lunas" ? (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                disabled={settlingId === ret.id}
                                onClick={() => handleSettleFine(ret.id)}
                              >
                                {settlingId === ret.id ? (
                                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CreditCard className="mr-1 h-3.5 w-3.5" />
                                )}
                                Tandai Lunas
                              </Button>
                            ) : (
                              <span className="inline-flex items-center text-xs text-emerald-600 font-medium px-2 py-1">
                                <Check className="mr-1 h-3.5 w-3.5" /> Selesai
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Tidak ada data transaksi peminjaman pada filter ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Verifikasi Pengembalian & Kalkulator Denda */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-primary/20 max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b pb-4 bg-muted/20">
              <CardTitle className="text-xl flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" /> Verifikasi Pengembalian Alat
              </CardTitle>
              <CardDescription>
                Peminjam: <strong className="text-foreground">{selectedLoan.peminjam?.nama_lengkap}</strong> —{" "}
                Alat: <strong className="text-foreground">{selectedLoan.alat?.nama}</strong> ({selectedLoan.jumlah} unit)
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleShowPreview}>
              <CardContent className="space-y-4 pt-5">
                {returnMsg && (
                  <div className={`p-3 rounded-md text-sm ${returnMsg.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
                    {returnMsg.text}
                  </div>
                )}

                {/* 1. Kondisi Fisik Alat */}
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">1. Kondisi Fisik Alat Saat Dikembalikan</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                    value={kondisiAfter}
                    onChange={(e) => {
                      const val = e.target.value as KondisiAlat;
                      setKondisiAfter(val);
                      if (val === "baik") {
                        setDendaKerusakan(0);
                      }
                    }}
                  >
                    <option value="baik">Baik (Normal tanpa kerusakan)</option>
                    <option value="rusak_ringan">Rusak Ringan (Baret / lecet / kabel kendur)</option>
                    <option value="rusak_berat">Rusak Berat (Patah / mati total / komponen pecah)</option>
                  </select>
                </div>

                {/* 2. Jika Rusak: Input Taksiran Petugas */}
                {kondisiAfter !== "baik" && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs">
                      <Wrench className="h-4 w-4" /> Taksiran Kerusakan oleh Petugas (Human Assessor)
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="denda-rusak" className="text-xs font-medium">
                        Nominal Biaya Perbaikan / Ganti Rugi
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground select-none">Rp</span>
                        <Input
                          id="denda-rusak"
                          type="text"
                          inputMode="numeric"
                          className="bg-background pl-10 font-semibold tabular-nums"
                          placeholder="0"
                          value={dendaKerusakanDisplay}
                          onChange={(e) => {
                            const raw = parseRupiahInput(e.target.value);
                            setDendaKerusakan(raw);
                            setDendaKerusakanDisplay(formatThousands(raw));
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Masukkan estimasi biaya servis / ganti rugi riil. Hanya angka, format otomatis.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="catatan-rusak" className="text-xs font-medium">
                        Keterangan Kerusakan / Catatan
                      </Label>
                      <Input
                        id="catatan-rusak"
                        type="text"
                        className="bg-background capitalize"
                        placeholder="Contoh: Tombol Power Patah, Adaptor Terkelupas..."
                        value={catatan}
                        onChange={(e) => setCatatan(toTitleCase(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {/* 3. Live Card Perhitungan Denda Transparan */}
                <div className="p-4 bg-muted/30 border border-border/70 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Tanggal Jatuh Tempo:</span>
                    <span className="font-semibold text-foreground">{selectedLoan.tanggal_jatuh_tempo}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">
                      Denda Keterlambatan ({liveCalculation.daysLate} hari × {liveCalculation.qty} unit × Rp 5.000):
                    </span>
                    <span className="font-semibold text-foreground">{formatRupiah(liveCalculation.dendaTelat)}</span>
                  </div>

                  {kondisiAfter !== "baik" && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Denda Kerusakan (Taksiran Petugas):</span>
                      <span className="font-semibold text-foreground">{formatRupiah(liveCalculation.dendaRusak)}</span>
                    </div>
                  )}

                  <div className="border-t pt-2 flex justify-between items-center font-bold text-sm">
                    <span className="text-foreground">Total Denda yang Harus Dibayar:</span>
                    <span className={`text-base ${liveCalculation.totalDenda > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {formatRupiah(liveCalculation.totalDenda)}
                    </span>
                  </div>
                </div>

                {/* 4. Pilihan Status Pembayaran jika Denda > 0 */}
                {liveCalculation.totalDenda > 0 && (
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Status Pembayaran Denda</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:outline-none"
                      value={statusPembayaran}
                      onChange={(e) => setStatusPembayaran(e.target.value as StatusPembayaranDenda)}
                    >
                      <option value="lunas">Lunas (Peminjam langsung membayar tunai sekarang)</option>
                      <option value="belum_lunas">Belum Lunas (Tercatat sebagai piutang/tunggakan)</option>
                      <option value="bebas_denda">Bebas Denda (Dispensasi khusus)</option>
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Jika peminjam belum membawa uang, pilih <strong>Belum Lunas</strong> agar dapat ditagih dan dilunasi nanti.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setSelectedLoan(null)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-primary" disabled={isProcessing}>
                  <Eye className="mr-2 h-4 w-4" /> Tinjau & Selesaikan
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Dialog Preview Konfirmasi Sebelum Submit Pengembalian */}
      {showPreview && selectedLoan && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/30 max-h-[85vh] overflow-y-auto">
            <CardHeader className="border-b bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" /> Konfirmasi Pengembalian
              </CardTitle>
              <CardDescription>Periksa kembali data berikut sebelum disimpan ke database.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              {returnMsg && (
                <div className={`p-3 rounded-md text-sm ${returnMsg.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
                  {returnMsg.text}
                </div>
              )}

              <div className="rounded-xl border border-border/70 divide-y divide-border/50 text-sm">
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-muted-foreground">Peminjam</span>
                  <span className="font-semibold text-foreground">{selectedLoan.peminjam?.nama_lengkap}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-muted-foreground">Alat</span>
                  <span className="font-semibold text-foreground">{selectedLoan.alat?.nama} ({selectedLoan.jumlah} unit)</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-muted-foreground">Kondisi Fisik</span>
                  <Badge variant="outline" className={getKondisiBadgeInfo(kondisiAfter).className}>
                    {getKondisiBadgeInfo(kondisiAfter).label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-muted-foreground">Denda Keterlambatan</span>
                  <span className="font-semibold">{formatRupiah(liveCalculation.dendaTelat)}</span>
                </div>
                {kondisiAfter !== "baik" && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-muted-foreground">Denda Kerusakan</span>
                    <span className="font-semibold">{formatRupiah(liveCalculation.dendaRusak)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-3 bg-muted/30">
                  <span className="font-bold text-foreground">Total Denda</span>
                  <span className={`font-bold text-base ${liveCalculation.totalDenda > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {formatRupiah(liveCalculation.totalDenda)}
                  </span>
                </div>
                {liveCalculation.totalDenda > 0 && (
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-muted-foreground">Status Pembayaran</span>
                    <Badge variant="outline" className={getStatusPembayaranBadgeInfo(statusPembayaran).className}>
                      {getStatusPembayaranBadgeInfo(statusPembayaran).label}
                    </Badge>
                  </div>
                )}
                {kondisiAfter !== "baik" && (
                  <div className="px-4 py-2.5 bg-amber-500/10 border-t border-border/50">
                    <span className="text-muted-foreground text-xs font-semibold flex items-center gap-1.5 text-amber-800">
                      <FileText className="h-3.5 w-3.5" /> Keterangan / Catatan Kerusakan:
                    </span>
                    <p className="font-medium text-foreground mt-1 text-xs">
                      {catatan.trim() ? (
                        <span className="font-semibold italic text-foreground">"{catatan}"</span>
                      ) : (
                        <span className="text-muted-foreground italic">(Tidak ada catatan tambahan)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setShowPreview(false)} disabled={isProcessing}>
                Kembali Edit
              </Button>
              <Button
                type="button"
                className="bg-primary"
                disabled={isProcessing}
                onClick={handleConfirmSubmit}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Konfirmasi & Simpan
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Dialog Preview Detail Transaksi (Saat data baris diklik) */}
      {detailLoan && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDetailLoan(null)}
        >
          <Card 
            className="w-full max-w-xl shadow-2xl border-border/80 max-h-[90vh] flex flex-col overflow-hidden bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b bg-muted/30 pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Pratinjau Detail Transaksi
                  </CardTitle>
                  <Badge variant="outline" className={getStatusBadgeInfo(detailLoan.status).className}>
                    {getStatusBadgeInfo(detailLoan.status).label}
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
              {/* Ringkasan Utama: Peminjam & Alat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <User className="h-3.5 w-3.5 text-primary" /> Data Peminjam
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {detailLoan.peminjam?.nama_lengkap || "Peminjam"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Peran: <strong className="capitalize text-foreground">{detailLoan.peminjam?.peran || "Peminjam"}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Package className="h-3.5 w-3.5 text-primary" /> Data Alat
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {detailLoan.alat?.nama || "Alat"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Jumlah: <strong className="text-foreground">{detailLoan.jumlah} unit</strong></span>
                    {detailLoan.alat?.kondisi && (
                      <Badge variant="outline" className={getKondisiBadgeInfo(detailLoan.alat.kondisi).className}>
                        Master: {getKondisiBadgeInfo(detailLoan.alat.kondisi).label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Jadwal Peminjaman */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/10 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Jadwal Waktu
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

              {/* Informasi Pengembalian & Denda */}
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
                          <FileText className="h-3.5 w-3.5 text-primary" /> Hasil Pemeriksaan & Denda
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
                        <span className="text-muted-foreground block text-[11px] font-semibold">Catatan Kerusakan Petugas:</span>
                        <p className="mt-0.5 font-medium text-foreground italic">
                          {ret.catatan ? `"${ret.catatan}"` : "Tidak ada catatan khusus."}
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  const daysLate = getDaysLate(detailLoan.tanggal_jatuh_tempo);
                  const estLateFine = daysLate * 5000 * Number(detailLoan.jumlah || 1);

                  return (
                    <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5 text-blue-500" /> Status Pengembalian Fisik
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Alat saat ini berstatus <strong>Sedang Dipinjam</strong> dan belum diverifikasi pengembaliannya ke gudang.
                      </p>
                      {daysLate > 0 ? (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Terlambat {daysLate} hari!</span>
                            <p className="text-[11px] text-rose-600/90 mt-0.5">
                              Estimasi denda keterlambatan berjalan: <strong>{formatRupiah(estLateFine)}</strong> (Rp 5.000 x {detailLoan.jumlah} unit x {daysLate} hari).
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

            <CardFooter className="border-t bg-muted/20 flex justify-between gap-2 p-3">
              <Button variant="outline" size="sm" onClick={() => setDetailLoan(null)}>
                Tutup
              </Button>
              <div className="flex items-center gap-2">
                {detailLoan.status === "disetujui" && (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    onClick={() => {
                      const target = detailLoan;
                      setDetailLoan(null);
                      handleOpenReturnModal(target);
                    }}
                  >
                    <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" /> Proses Pengembalian Sekarang
                  </Button>
                )}
                {(() => {
                  const ret = getReturnData(detailLoan);
                  if (ret && ret.status_pembayaran === "belum_lunas") {
                    return (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        disabled={settlingId === ret.id}
                        onClick={async () => {
                          const id = ret.id;
                          await handleSettleFine(id);
                          setDetailLoan(null);
                        }}
                      >
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Tandai Lunas Sekarang
                      </Button>
                    );
                  }
                  return null;
                })()}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
