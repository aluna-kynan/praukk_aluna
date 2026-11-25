"use client";

import { useState, useEffect } from "react";
import { Printer, Download, Calendar, Loader2, Filter, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { getReportDataAction } from "@/actions/reports";
import { downloadTransactionReportPdf } from "@/lib/pdf-report";
import { 
  formatRupiah, 
  getKondisiBadgeInfo, 
  getStatusBadgeInfo,
  getStatusPembayaranBadgeInfo 
} from "@/lib/status-mapper";
import { TIME_FILTER_OPTIONS, getDatePresetRange, TimeFilterOption } from "@/lib/date-utils";

export default function ReportsPage() {
  const [selectedPreset, setSelectedPreset] = useState<TimeFilterOption>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Set default "Semua Waktu" on mount
  useEffect(() => {
    const range = getDatePresetRange("all");
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    fetchReport(range.startDate, range.endDate);
  }, []);

  const fetchReport = async (start = startDate, end = endDate) => {
    setLoading(true);
    const data = await getReportDataAction(start || undefined, end || undefined);
    setReportData(data);
    setLoading(false);
  };

  const handleApplyPreset = (preset: TimeFilterOption) => {
    setSelectedPreset(preset);
    const range = getDatePresetRange(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    fetchReport(range.startDate, range.endDate);
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;
    downloadTransactionReportPdf({
      reportData,
      startDate,
      endDate,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Laporan Transaksi</h1>
        </div>
      </div>

      {/* Header Khusus Print PDF */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Laporan Peminjaman, Pengembalian & Denda Alat</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Periode: {startDate ? new Date(startDate).toLocaleDateString("id-ID") : "Awal"} s/d {endDate ? new Date(endDate).toLocaleDateString("id-ID") : "Hari Ini"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        <Card className="shadow-sm border-border/50 !gap-0 !py-0">
          <CardHeader className="bg-muted/20 border-b !py-3 !px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" /> Filter Periode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {/* Quick Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Periode Waktu</Label>
              <select
                value={selectedPreset}
                onChange={(e) => handleApplyPreset(e.target.value as TimeFilterOption)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium cursor-pointer"
              >
                {TIME_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Dari Tanggal</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="start-date" 
                    type="date" 
                    className="pl-8 bg-background" 
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSelectedPreset("all");
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Sampai Tanggal</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="end-date" 
                    type="date" 
                    className="pl-8 bg-background" 
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSelectedPreset("all");
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={() => fetchReport(startDate, endDate)} variant="outline" className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Terapkan Filter Tanggal"}
              </Button>
            </div>

            <div className="pt-3">
              <Button
                className="w-full bg-primary"
                onClick={handleDownloadPDF}
                disabled={loading || !reportData}
              >
                <Download className="mr-2 h-4 w-4" /> Unduh PDF Laporan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ringkasan Data Finansial & Operasional */}
        <Card className="shadow-sm border-border/50 !gap-0 !py-0">
          <CardHeader className="bg-muted/20 border-b !py-3 !px-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" /> Ringkasan Statistik Denda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {reportData ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground font-medium">Total Peminjaman</p>
                    <p className="font-bold text-xl text-primary mt-1">{reportData.totalLoans}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground font-medium">Pengembalian Selesai</p>
                    <p className="font-bold text-xl text-emerald-600 mt-1">{reportData.totalReturns}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="font-medium text-sm text-emerald-700">Denda Tertagih (Lunas)</p>
                    <p className="text-xs text-muted-foreground">Uang kas denda yang telah diterima</p>
                  </div>
                  <span className="font-bold text-lg text-emerald-600">{formatRupiah(reportData.totalDendaLunas || 0)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="font-medium text-sm text-rose-700">Denda Tertunggak (Piutang)</p>
                    <p className="text-xs text-muted-foreground">Denda belum dibayar oleh peminjam</p>
                  </div>
                  <span className="font-bold text-lg text-rose-600">{formatRupiah(reportData.totalDendaTertunggak || 0)}</span>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Memuat data...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabel Rincian Transaksi Siap Cetak */}
      <Card className="shadow-sm border-border/50 !gap-0 !py-0 print:border-none print:shadow-none">
        <CardHeader className="bg-muted/20 border-b !py-3 !px-4 print:bg-transparent print:border-b-2">
          <CardTitle className="text-base font-semibold">
            Tabel Rekapitulasi Peminjaman, Pengembalian &amp; Denda
          </CardTitle>
          <CardDescription className="print:hidden">
            Rincian seluruh transaksi pada periode yang dipilih.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30 print:bg-gray-100">
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Peminjam</TableHead>
                <TableHead>Alat</TableHead>
                <TableHead>Tgl Ajukan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tgl Kembali &amp; Kondisi</TableHead>
                <TableHead className="text-right">Denda Telat</TableHead>
                <TableHead className="text-right">Denda Rusak</TableHead>
                <TableHead className="text-right">Total Denda</TableHead>
                <TableHead className="text-center">Pembayaran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData && reportData.loans && reportData.loans.length > 0 ? (
                reportData.loans.map((loan: any, idx: number) => {
                  const retRaw = loan.pengembalian;
                  const ret = Array.isArray(retRaw) ? retRaw[0] : retRaw;
                  const loanStatusInfo = getStatusBadgeInfo(loan.status);
                  const kondisiInfo = ret ? getKondisiBadgeInfo(ret.kondisi_setelah || "baik") : null;
                  const fineStatusInfo = ret
                    ? getStatusPembayaranBadgeInfo(ret.status_pembayaran || "lunas")
                    : null;

                  return (
                    <TableRow key={loan.id} className="print:border-b">
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {loan.peminjam?.nama_lengkap || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {loan.alat?.nama || "-"} ({loan.jumlah || 1} unit)
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {loan.diajukan_pada ? new Date(loan.diajukan_pada).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${loanStatusInfo.className}`}>
                          {loanStatusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ret ? (
                          <div className="space-y-0.5">
                            <div className="text-[11px] text-muted-foreground">
                              {ret.dikembalikan_pada
                                ? new Date(ret.dikembalikan_pada).toLocaleDateString("id-ID")
                                : "-"}
                            </div>
                            {kondisiInfo && (
                              <Badge variant="outline" className={`text-[10px] ${kondisiInfo.className}`}>
                                {kondisiInfo.label}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {ret ? formatRupiah(ret.denda_keterlambatan || 0) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {ret ? formatRupiah(ret.denda_kerusakan || 0) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        {ret ? formatRupiah(ret.jumlah_denda || 0) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {fineStatusInfo ? (
                          <Badge variant="outline" className={`text-[10px] ${fineStatusInfo.className}`}>
                            {fineStatusInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-28 text-center text-muted-foreground text-xs">
                    Tidak ada data transaksi pada periode ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
