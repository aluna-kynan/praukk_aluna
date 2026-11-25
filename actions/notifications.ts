"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAction } from "@/actions/auth";

export interface RoleNotification {
  id: string;
  type: "info" | "warning" | "success" | "danger";
  title: string;
  desc: string;
  timestamp: string;
  href: string;
}

export async function getRoleNotificationsAction(): Promise<RoleNotification[]> {
  const currentUser = await getCurrentUserAction();
  if (!currentUser) return [];

  const supabase = await createClient();
  const role = currentUser.peran;
  const items: RoleNotification[] = [];

  if (role === "admin") {
    let { data: logs, error } = await supabase
      .from("log_aktivitas")
      .select(`
        id, aksi, tabel_target, created_at,
        pengguna:pengguna_id (nama_lengkap, peran)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      const fallback = await supabase
        .from("log_aktivitas")
        .select(`
          id, aksi, tabel_target, dibuat_pada,
          pengguna:pengguna_id (nama_lengkap, peran)
        `)
        .order("dibuat_pada", { ascending: false })
        .limit(10);
      logs = fallback.data as any;
    }

    for (const log of logs || []) {
      const actor = (log as any).pengguna?.nama_lengkap || "Sistem";
      const ts = (log as any).created_at || (log as any).dibuat_pada || new Date().toISOString();
      const target = (log as any).tabel_target;
      const href =
        target === "pengguna"
          ? "/users"
          : target === "alat"
          ? "/admin/tools"
          : target === "kategori"
          ? "/categories"
          : "/logs";

      items.push({
        id: `log-${log.id}`,
        type: "info",
        title: `Aktivitas: ${actor}`,
        desc: log.aksi,
        timestamp: ts,
        href,
      });
    }

    return items;
  }

  if (role === "petugas") {
    const { data: loans } = await supabase
      .from("peminjaman")
      .select(`
        id, jumlah, status, tanggal_jatuh_tempo, diajukan_pada, pengajuan_pengembalian_pada,
        alat:alat_id (nama),
        peminjam:peminjam_id (nama_lengkap)
      `)
      .in("status", ["diajukan", "disetujui", "terlambat"])
      .order("diajukan_pada", { ascending: false })
      .limit(20);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const loan of loans || []) {
      const borrower = (loan as any).peminjam?.nama_lengkap || "Peminjam";
      const toolName = (loan as any).alat?.nama || "Alat";

      if (loan.status === "diajukan") {
        items.push({
          id: `req-${loan.id}`,
          type: "info",
          title: "Pengajuan Peminjaman Baru",
          desc: `${borrower} mengajukan ${toolName} (${loan.jumlah} unit).`,
          timestamp: loan.diajukan_pada,
          href: "/approvals",
        });
      } else if ((loan as any).pengajuan_pengembalian_pada) {
        items.push({
          id: `retreq-${loan.id}`,
          type: "warning",
          title: "Pengajuan Pengembalian",
          desc: `${borrower} mengajukan pengembalian ${toolName} (${loan.jumlah} unit).`,
          timestamp: (loan as any).pengajuan_pengembalian_pada,
          href: "/monitoring",
        });
      } else if (loan.tanggal_jatuh_tempo) {
        const due = new Date(loan.tanggal_jatuh_tempo);
        due.setHours(0, 0, 0, 0);
        if (today > due || loan.status === "terlambat") {
          items.push({
            id: `late-${loan.id}`,
            type: "danger",
            title: "Peminjaman Terlambat",
            desc: `${borrower} melewati jatuh tempo untuk ${toolName}.`,
            timestamp: loan.tanggal_jatuh_tempo,
            href: "/monitoring",
          });
        }
      }
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, 12);
  }

  // Role: peminjam
  const { data: myLoans } = await supabase
    .from("peminjaman")
    .select(`
      id, jumlah, status, tanggal_jatuh_tempo, diajukan_pada, tanggal_pinjam, pengajuan_pengembalian_pada,
      alat:alat_id (nama),
      pengembalian:pengembalian (status_pembayaran, dikembalikan_pada, jumlah_denda)
    `)
    .eq("peminjam_id", currentUser.id)
    .order("diajukan_pada", { ascending: false })
    .limit(12);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const loan of myLoans || []) {
    const toolName = (loan as any).alat?.nama || "Alat";
    const retRaw = (loan as any).pengembalian;
    const ret = Array.isArray(retRaw) ? retRaw[0] : retRaw;

    if (ret && ret.status_pembayaran === "belum_lunas") {
      items.push({
        id: `fine-${loan.id}`,
        type: "danger",
        title: "Denda Belum Lunas",
        desc: `Terdapat tunggakan denda untuk ${toolName}.`,
        timestamp: ret.dikembalikan_pada || loan.diajukan_pada,
        href: "/my-loans",
      });
      continue;
    }

    if (loan.status === "dikembalikan") {
      items.push({
        id: `done-${loan.id}`,
        type: "success",
        title: "Pengembalian Selesai",
        desc: `Pengembalian ${toolName} (${loan.jumlah} unit) telah diverifikasi.`,
        timestamp: ret?.dikembalikan_pada || loan.diajukan_pada,
        href: "/my-loans",
      });
    } else if ((loan as any).pengajuan_pengembalian_pada) {
      items.push({
        id: `waitret-${loan.id}`,
        type: "info",
        title: "Menunggu Konfirmasi Petugas",
        desc: `Pengajuan pengembalian ${toolName} sedang menunggu verifikasi.`,
        timestamp: (loan as any).pengajuan_pengembalian_pada,
        href: "/my-loans",
      });
    } else if (loan.status === "disetujui" || loan.status === "terlambat") {
      const due = loan.tanggal_jatuh_tempo ? new Date(loan.tanggal_jatuh_tempo) : null;
      if (due) due.setHours(0, 0, 0, 0);
      if ((due && today > due) || loan.status === "terlambat") {
        items.push({
          id: `overdue-${loan.id}`,
          type: "warning",
          title: "Peminjaman Terlambat",
          desc: `Segera kembalikan ${toolName} (${loan.jumlah} unit).`,
          timestamp: loan.tanggal_jatuh_tempo,
          href: "/my-loans",
        });
      } else {
        items.push({
          id: `approved-${loan.id}`,
          type: "success",
          title: "Peminjaman Disetujui",
          desc: `${toolName} (${loan.jumlah} unit) siap/sedang digunakan.`,
          timestamp: loan.tanggal_pinjam || loan.diajukan_pada,
          href: "/my-loans",
        });
      }
    } else if (loan.status === "ditolak") {
      items.push({
        id: `rejected-${loan.id}`,
        type: "danger",
        title: "Peminjaman Ditolak",
        desc: `Pengajuan ${toolName} (${loan.jumlah} unit) ditolak petugas.`,
        timestamp: loan.diajukan_pada,
        href: "/my-loans",
      });
    } else if (loan.status === "diajukan") {
      items.push({
        id: `pending-${loan.id}`,
        type: "info",
        title: "Menunggu Persetujuan",
        desc: `Pengajuan ${toolName} (${loan.jumlah} unit) sedang ditinjau.`,
        timestamp: loan.diajukan_pada,
        href: "/my-loans",
      });
    }
  }

  return items;
}
