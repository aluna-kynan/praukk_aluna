"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoansAction, approveLoanAction, rejectLoanAction } from "@/actions/loans";

export default function ApprovalsPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadLoans = async () => {
    setLoading(true);
    const data = await getLoansAction("diajukan");
    setLoans(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    await approveLoanAction(id);
    await loadLoans();
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    await rejectLoanAction(id);
    await loadLoans();
    setProcessingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Persetujuan Peminjaman</h1>
          <p className="text-muted-foreground mt-1">Kelola dan setujui pengajuan peminjaman alat dari pengguna.</p>
        </div>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            Pengajuan Menunggu Persetujuan
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-full">
              {loans.length}
            </Badge>
          </CardTitle>
          <CardDescription>Segera proses pengajuan yang masuk agar stok alat dapat diperbarui secara akurat.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat pengajuan dari Supabase...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Peminjam</TableHead>
                  <TableHead>Alat</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Tgl Pengajuan</TableHead>
                  <TableHead>Tgl Pengembalian</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length > 0 ? (
                  loans.map((loan) => (
                    <TableRow key={loan.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{loan.peminjam?.nama_lengkap || "Peminjam"}</TableCell>
                      <TableCell>{loan.alat?.nama || "Alat"}</TableCell>
                      <TableCell>{loan.jumlah} unit</TableCell>
                      <TableCell className="text-muted-foreground">
                        {loan.diajukan_pada ? new Date(loan.diajukan_pada).toLocaleDateString('id-ID') : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {loan.tanggal_jatuh_tempo ? new Date(loan.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 h-8 text-white"
                            disabled={processingId === loan.id}
                            onClick={() => handleApprove(loan.id)}
                          >
                            {processingId === loan.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="mr-1 h-3.5 w-3.5" /> Setujui
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8"
                            disabled={processingId === loan.id}
                            onClick={() => handleReject(loan.id)}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Tolak
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2 py-6">
                        <CheckCircle className="h-8 w-8 text-muted-foreground/30" />
                        <p>Tidak ada pengajuan yang menunggu persetujuan.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
