import { StatusPeminjaman, KondisiAlat, PeranPengguna, StatusPembayaranDenda } from "@/types/database.types";

export function getStatusBadgeInfo(status: StatusPeminjaman | string) {
  switch (status) {
    case 'diajukan':
    case 'pending':
      return { label: 'Diajukan', variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' };
    case 'disetujui':
    case 'approved':
      return { label: 'Disetujui', variant: 'outline' as const, className: 'bg-green-500/10 text-green-600 border-green-500/20' };
    case 'ditolak':
    case 'rejected':
      return { label: 'Ditolak', variant: 'outline' as const, className: 'bg-red-500/10 text-red-600 border-red-500/20' };
    case 'dikembalikan':
    case 'returned':
      return { label: 'Dikembalikan', variant: 'outline' as const, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    case 'terlambat':
    case 'overdue':
      return { label: 'Terlambat', variant: 'destructive' as const, className: 'bg-rose-600 text-white' };
    default:
      return { label: status, variant: 'outline' as const, className: 'bg-gray-500/10 text-gray-600' };
  }
}

export function getKondisiBadgeInfo(kondisi: KondisiAlat | string) {
  switch (kondisi) {
    case 'baik':
      return { label: 'Baik', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    case 'rusak_ringan':
      return { label: 'Rusak Ringan', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    case 'rusak_berat':
      return { label: 'Rusak Berat', className: 'bg-red-500/10 text-red-600 border-red-500/20' };
    default:
      return { label: kondisi, className: 'bg-gray-500/10 text-gray-600' };
  }
}

export function getStatusPembayaranBadgeInfo(status: StatusPembayaranDenda | string) {
  switch (status) {
    case 'lunas':
      return { label: 'Lunas', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    case 'belum_lunas':
      return { label: 'Belum Lunas', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
    case 'bebas_denda':
      return { label: 'Bebas Denda', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    default:
      return { label: status, className: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
  }
}

export function getPeranLabel(peran: PeranPengguna | string) {
  switch (peran) {
    case 'admin':
      return { label: 'Administrator', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
    case 'petugas':
      return { label: 'Petugas', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    case 'peminjam':
      return { label: 'Peminjam', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    default:
      return { label: peran, className: 'bg-gray-500/10 text-gray-600' };
  }
}

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
