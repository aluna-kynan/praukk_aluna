-- =====================================================================
-- MIGRASI: Tambah kolom rincian denda & status pembayaran
-- Jalankan skrip ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- Aman dijalankan berulang (idempotent) karena pakai IF NOT EXISTS
-- =====================================================================

-- 1. Buat enum status_pembayaran_denda jika belum ada
do $$ begin
  if not exists (select 1 from pg_type where typname = 'status_pembayaran_denda') then
    create type status_pembayaran_denda as enum ('lunas', 'belum_lunas', 'bebas_denda');
  end if;
end $$;

-- 2. Tambahkan kolom-kolom baru ke tabel pengembalian
alter table pengembalian add column if not exists denda_keterlambatan numeric(12,2) not null default 0;
alter table pengembalian add column if not exists denda_kerusakan numeric(12,2) not null default 0;
alter table pengembalian add column if not exists catatan text;

-- Kolom status_pembayaran perlu penanganan khusus karena tipe enum custom
do $$ begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'pengembalian' and column_name = 'status_pembayaran'
  ) then
    alter table pengembalian 
      add column status_pembayaran status_pembayaran_denda not null default 'lunas';
  end if;
end $$;

-- 3. Update fn_hitung_denda agar memperhitungkan kuantitas unit
create or replace function fn_hitung_denda(p_peminjaman_id text)
returns numeric
language plpgsql
stable
as $$
declare
  v_jatuh_tempo date;
  v_jumlah      int;
  v_hari_telat  int;
  v_tarif       numeric := 5000; -- tarif per hari per unit
begin
  select tanggal_jatuh_tempo, jumlah into v_jatuh_tempo, v_jumlah
  from peminjaman where id = p_peminjaman_id;

  v_hari_telat := greatest(0, (current_date - v_jatuh_tempo));
  return v_hari_telat * v_tarif * coalesce(v_jumlah, 1);
end;
$$;

-- 4. Update fn_proses_pengembalian dengan parameter denda kerusakan & status bayar
create or replace function fn_proses_pengembalian(
  p_peminjaman_id     text,
  p_kondisi           kondisi_alat,
  p_denda_kerusakan   numeric default 0,
  p_status_pembayaran status_pembayaran_denda default 'lunas',
  p_catatan           text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_denda_telat  numeric;
  v_denda_rusak  numeric;
  v_total_denda  numeric;
  v_alat_id      text;
  v_jumlah       int;
  v_status_bayar status_pembayaran_denda;
begin
  if fn_peran_saya() not in ('petugas', 'admin') then
    raise exception 'Tidak memiliki izin memproses pengembalian';
  end if;

  select alat_id, jumlah into v_alat_id, v_jumlah
  from peminjaman
  where id = p_peminjaman_id and status = 'disetujui';

  if v_alat_id is null then
    raise exception 'Peminjaman tidak ditemukan atau belum disetujui';
  end if;

  v_denda_telat := fn_hitung_denda(p_peminjaman_id);

  if p_kondisi = 'baik' then
    v_denda_rusak := 0;
  else
    v_denda_rusak := greatest(0, coalesce(p_denda_kerusakan, 0));
  end if;

  v_total_denda := v_denda_telat + v_denda_rusak;

  if v_total_denda = 0 then
    v_status_bayar := 'lunas';
  else
    v_status_bayar := coalesce(p_status_pembayaran, 'lunas');
  end if;

  insert into pengembalian (
    peminjaman_id, kondisi_setelah, 
    denda_keterlambatan, denda_kerusakan, jumlah_denda, 
    status_pembayaran, catatan, diverifikasi_oleh
  )
  values (
    p_peminjaman_id, p_kondisi, 
    v_denda_telat, v_denda_rusak, v_total_denda, 
    v_status_bayar, p_catatan, auth.uid()
  );

  update peminjaman set status = 'dikembalikan' where id = p_peminjaman_id;
  update alat set stok_tersedia = stok_tersedia + v_jumlah where id = v_alat_id;
  perform fn_catat_log('memproses pengembalian', 'peminjaman', p_peminjaman_id);
end;
$$;

-- 5. Tambah function pelunasan denda
create or replace function fn_lunasi_denda(p_pengembalian_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if fn_peran_saya() not in ('petugas', 'admin') then
    raise exception 'Tidak memiliki izin melunasi denda';
  end if;

  update pengembalian
  set status_pembayaran = 'lunas'
  where id = p_pengembalian_id;

  if not found then
    raise exception 'Data pengembalian tidak ditemukan';
  end if;

  perform fn_catat_log('melunasi denda pengembalian', 'pengembalian', p_pengembalian_id);
end;
$$;

-- =====================================================================
-- SELESAI! Refresh halaman monitoring setelah menjalankan skrip ini.
-- =====================================================================
