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
import { 
  formatRupiah, 
  getKondisiBadgeInfo, 
  getStatusPembayaranBadgeInfo 
} from "@/lib/status-mapper";
import { TIME_FILTER_OPTIONS, getDatePresetRange, TimeFilterOption } from "@/lib/date-utils";

export default function ReportsPage() {
  const [selectedPreset, setSelectedPreset] = useState<TimeFilterOption>("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Set default "Bulan Ini" on mount
  useEffect(() => {
    const range = getDatePresetRange("this_month");
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

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cetak Laporan Rekapitulasi</h1>
          <p className="text-muted-foreground mt-1">
            Ekspor dan cetak laporan riwayat peminjaman, rincian denda keterlambatan & kerusakan, serta piutang.
          </p>
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
        <Card className="shadow-sm border-border/50">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" /> Filter Periode Laporan
            </CardTitle>
            <CardDescription>Filter berdasarkan rentang tanggal transaksi pengembalian.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Quick Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Preset Periode Cepat:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_FILTER_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={selectedPreset === opt.value ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-md"
                    onClick={() => handleApplyPreset(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
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
              <Button className="w-full bg-primary" onClick={handlePrintPDF}>
                <Printer className="mr-2 h-4 w-4" /> Cetak / Print PDF Laporan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ringkasan Data Finansial & Operasional */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="bg-muted/20 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" /> Ringkasan Statistik Denda
            </CardTitle>
            <CardDescription>Kalkulasi denda tertagih vs piutang real-time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
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

                <div className="text-xs text-muted-foreground pt-1 flex justify-between px-1">
                  <span>Rincian: Telat {formatRupiah(reportData.totalDendaTelat || 0)}</span>
                  <span>Kerusakan {formatRupiah(reportData.totalDendaKerusakan || 0)}</span>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Memuat data ringkasan...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabel Rincian Pengembalian & Denda Siap Cetak */}
      <Card className="shadow-sm border-border/50 print:border-none print:shadow-none">
        <CardHeader className="bg-muted/20 border-b pb-3 print:bg-transparent print:border-b-2">
          <CardTitle className="text-base font-semibold">
            Tabel Rekapitulasi Pengembalian & Denda
          </CardTitle>
          <CardDescription className="print:hidden">
            Rincian transaksi pengembalian pada periode yang dipilih.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30 print:bg-gray-100">
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Peminjam</TableHead>
                <TableHead>Alat</TableHead>
                <TableHead>Tgl Kembali</TableHead>
                <TableHead>Kondisi</TableHead>
                <TableHead className="text-right">Denda Telat</TableHead>
                <TableHead className="text-right">Denda Rusak</TableHead>
                <TableHead className="text-right">Total Denda</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData && reportData.returns.length > 0 ? (
                reportData.returns.map((ret: any, idx: number) => {
                  const statusInfo = getStatusPembayaranBadgeInfo(ret.status_pembayaran || "lunas");
                  const kondisiInfo = getKondisiBadgeInfo(ret.kondisi_setelah || "baik");
                  return (
                    <TableRow key={ret.id} className="print:border-b">
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-xs">
                        {ret.peminjaman?.peminjam?.nama_lengkap || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {ret.peminjaman?.alat?.nama || "-"} ({ret.peminjaman?.jumlah || 1} unit)
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ret.dikembalikan_pada ? new Date(ret.dikembalikan_pada).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <Badge variant="outline" className={`text-[10px] ${kondisiInfo.className}`}>
                            {kondisiInfo.label}
                          </Badge>
                          {ret.catatan && (
                            <div className="text-[10px] text-muted-foreground italic truncate max-w-[130px]" title={ret.catatan}>
                              {ret.catatan}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatRupiah(ret.denda_keterlambatan || 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatRupiah(ret.denda_kerusakan || 0)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        {formatRupiah(ret.jumlah_denda || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-muted-foreground text-xs">
                    Tidak ada data pengembalian pada periode ini.
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
