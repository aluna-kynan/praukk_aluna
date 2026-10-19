export type PeranPengguna = 'admin' | 'petugas' | 'peminjam';
export type KondisiAlat = 'baik' | 'rusak_ringan' | 'rusak_berat';
export type StatusPeminjaman = 'diajukan' | 'disetujui' | 'ditolak' | 'dikembalikan' | 'terlambat';
export type StatusPembayaranDenda = 'lunas' | 'belum_lunas' | 'bebas_denda';

export interface Pengguna {
  id: string;
  nama_lengkap: string;
  peran: PeranPengguna;
  dibuat_pada: string;
  email?: string;
}

export interface Kategori {
  id: string;
  nama: string;
  dibuat_pada: string;
}

export interface Alat {
  id: string;
  nama: string;
  kategori_id: string;
  stok_total: number;
  stok_tersedia: number;
  kondisi: KondisiAlat;
  dibuat_pada: string;
  kategori?: Kategori;
}

export interface Peminjaman {
  id: string;
  peminjam_id: string;
  alat_id: string;
  jumlah: number;
  status: StatusPeminjaman;
  tanggal_pinjam: string | null;
  tanggal_jatuh_tempo: string;
  diajukan_pada: string;
  disetujui_oleh: string | null;
  alat?: Alat;
  peminjam?: Pengguna;
  disetujui_oleh_user?: Pengguna;
  pengembalian?: Pengembalian | null;
}

export interface Pengembalian {
  id: string;
  peminjaman_id: string;
  dikembalikan_pada: string;
  kondisi_setelah: KondisiAlat;
  denda_keterlambatan: number;
  denda_kerusakan: number;
  jumlah_denda: number;
  status_pembayaran: StatusPembayaranDenda;
  catatan?: string | null;
  diverifikasi_oleh: string | null;
  peminjaman?: Peminjaman;
  diverifikasi_oleh_user?: Pengguna;
}

export interface LogAktivitas {
  id: string;
  pengguna_id: string | null;
  aksi: string;
  tabel_target: string | null;
  id_target: string | null;
  dibuat_pada: string;
  pengguna?: Pengguna;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      pengguna: {
        Row: Pengguna;
        Insert: {
          id?: string;
          nama_lengkap: string;
          peran?: PeranPengguna;
          dibuat_pada?: string;
        };
        Update: {
          id?: string;
          nama_lengkap?: string;
          peran?: PeranPengguna;
          dibuat_pada?: string;
        };
        Relationships: [];
      };
      kategori: {
        Row: Kategori;
        Insert: {
          id?: string;
          nama: string;
          dibuat_pada?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          dibuat_pada?: string;
        };
        Relationships: [];
      };
      alat: {
        Row: Alat;
        Insert: {
          id?: string;
          nama: string;
          kategori_id: string;
          stok_total: number;
          stok_tersedia: number;
          kondisi?: KondisiAlat;
          dibuat_pada?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          kategori_id?: string;
          stok_total?: number;
          stok_tersedia?: number;
          kondisi?: KondisiAlat;
          dibuat_pada?: string;
        };
        Relationships: [];
      };
      peminjaman: {
        Row: Peminjaman;
        Insert: {
          id?: string;
          peminjam_id: string;
          alat_id: string;
          jumlah: number;
          status?: StatusPeminjaman;
          tanggal_pinjam?: string | null;
          tanggal_jatuh_tempo: string;
          diajukan_pada?: string;
          disetujui_oleh?: string | null;
        };
        Update: {
          id?: string;
          peminjam_id?: string;
          alat_id?: string;
          jumlah?: number;
          status?: StatusPeminjaman;
          tanggal_pinjam?: string | null;
          tanggal_jatuh_tempo?: string;
          diajukan_pada?: string;
          disetujui_oleh?: string | null;
        };
        Relationships: [];
      };
      pengembalian: {
        Row: Pengembalian;
        Insert: {
          id?: string;
          peminjaman_id: string;
          dikembalikan_pada?: string;
          kondisi_setelah: KondisiAlat;
          denda_keterlambatan?: number;
          denda_kerusakan?: number;
          jumlah_denda?: number;
          status_pembayaran?: StatusPembayaranDenda;
          catatan?: string | null;
          diverifikasi_oleh?: string | null;
        };
        Update: {
          id?: string;
          peminjaman_id?: string;
          dikembalikan_pada?: string;
          kondisi_setelah?: KondisiAlat;
          denda_keterlambatan?: number;
          denda_kerusakan?: number;
          jumlah_denda?: number;
          status_pembayaran?: StatusPembayaranDenda;
          catatan?: string | null;
          diverifikasi_oleh?: string | null;
        };
        Relationships: [];
      };
      log_aktivitas: {
        Row: LogAktivitas;
        Insert: {
          id?: string;
          pengguna_id?: string | null;
          aksi: string;
          tabel_target?: string | null;
          id_target?: string | null;
          dibuat_pada?: string;
        };
        Update: {
          id?: string;
          pengguna_id?: string | null;
          aksi?: string;
          tabel_target?: string | null;
          id_target?: string | null;
          dibuat_pada?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      fn_ajukan_peminjaman: {
        Args: {
          p_alat_id: string;
          p_jumlah: number;
          p_tanggal_jatuh_tempo: string;
        };
        Returns: string;
      };
      fn_setujui_peminjaman: {
        Args: {
          p_peminjaman_id: string;
        };
        Returns: void;
      };
      fn_tolak_peminjaman: {
        Args: {
          p_peminjaman_id: string;
        };
        Returns: void;
      };
      fn_proses_pengembalian: {
        Args: {
          p_peminjaman_id: string;
          p_kondisi: KondisiAlat;
          p_denda_kerusakan?: number;
          p_status_pembayaran?: StatusPembayaranDenda;
          p_catatan?: string | null;
        };
        Returns: void;
      };
      fn_lunasi_denda: {
        Args: {
          p_pengembalian_id: string;
        };
        Returns: void;
      };
      fn_hitung_denda: {
        Args: {
          p_peminjaman_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      peran_pengguna: PeranPengguna;
      kondisi_alat: KondisiAlat;
      status_peminjaman: StatusPeminjaman;
      status_pembayaran_denda: StatusPembayaranDenda;
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};
