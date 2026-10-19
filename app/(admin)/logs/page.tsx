"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, Loader2 } from "lucide-react";
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
import { getLogsAction } from "@/actions/logs";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getLogsAction();
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Log Aktivitas</h1>
          <p className="text-muted-foreground mt-1">Catatan riwayat transaksi dan aktivitas pengguna di sistem real-time.</p>
        </div>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Riwayat Aktivitas Sistem
          </CardTitle>
          <CardDescription>Menampilkan log aktivitas pengguna dari tabel `log_aktivitas` Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat log aktivitas dari Supabase...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Aktivitas / Aksi</TableHead>
                  <TableHead>Tabel Target</TableHead>
                  <TableHead className="text-right">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{log.pengguna?.nama_lengkap || "Sistem"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {log.aksi}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">{log.tabel_target || "-"}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground flex items-center justify-end gap-1 mt-3">
                        <Clock className="h-3 w-3" />
                        {log.dibuat_pada ? new Date(log.dibuat_pada).toLocaleString("id-ID") : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Belum ada log aktivitas tercatat di database.
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
