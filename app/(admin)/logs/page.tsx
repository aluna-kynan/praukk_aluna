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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLogsAction } from "@/actions/logs";

function getRoleBadge(peran?: string | null) {
  switch (peran) {
    case "admin":
      return {
        label: "Administrator",
        className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      };
    case "petugas":
      return {
        label: "Petugas",
        className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      };
    case "peminjam":
      return {
        label: "Peminjam",
        className: "bg-muted text-muted-foreground border-border",
      };
    default:
      return null;
  }
}

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
        </div>
      </div>

      <Card className="shadow-sm border-border/50 !gap-0 !py-0">
        <CardHeader className="!py-3 !px-4 border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Riwayat Aktivitas Sistem
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-4 w-[220px]">Pengguna</TableHead>
                  <TableHead className="px-4">Aktivitas</TableHead>
                  <TableHead className="px-4 w-[130px]">Target</TableHead>
                  <TableHead className="px-4 text-right w-[180px]">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => {
                    const timestamp = log.created_at || log.dibuat_pada;
                    const roleInfo = getRoleBadge(log.pengguna?.peran);
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/20">
                        <TableCell className="px-4 font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{log.pengguna?.nama_lengkap || "Sistem"}</span>
                            {roleInfo && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleInfo.className}`}>
                                {roleInfo.label}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            {log.aksi}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground capitalize text-sm">
                          {log.tabel_target || "-"}
                        </TableCell>
                        <TableCell className="px-4 text-right text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            {timestamp ? new Date(timestamp).toLocaleString("id-ID") : "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Belum ada log aktivitas tercatat.
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
