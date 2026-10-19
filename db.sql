-- =====================================================================
-- SKEMA DATABASE — APLIKASI PEMINJAMAN ALAT
-- Stack: Supabase (PostgreSQL) + Next.js 16
-- Penamaan tabel/kolom pakai Bahasa Indonesia, konsisten dengan istilah soal
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;

-- =====================================================================
-- 1. ID GENERATOR — generate_xid()
--    Menghasilkan ID 20 karakter (base32), sortable berdasarkan waktu.
--    Format: 8 char timestamp + 3 char machine_id + 9 char counter.
--    Counter pakai sequence (bukan random) supaya atomic & anti-tabrakan.
-- =====================================================================
create sequence if not exists xid_counter_seq;

create or replace function generate_xid()
returns text
language plpgsql
as $$
declare
  alphabet     text := '0123456789abcdefghjkmnpqrstvwxyz';
  machine_part text := coalesce(current_setting('app.machine_id', true), '001');
  ts_part      text := '';
  counter_part text := '';
  ts           bigint;
  counter      bigint;
  i            int;
  sisa         int;
begin
  ts := extract(epoch from clock_timestamp())::bigint;

  for i in 1..8 loop
    sisa := ts % 32;
    ts_part := substr(alphabet, sisa + 1, 1) || ts_part;
    ts := ts / 32;
  end loop;

  machine_part := lpad(substr(machine_part, 1, 3), 3, '0');

  -- sequence dibatasi ke 15-bit biar hasil counter tetap 9 karakter base32
  counter := nextval('xid_counter_seq') % 32768;

  for i in 1..9 loop
    sisa := counter % 32;
    counter_part := substr(alphabet, sisa + 1, 1) || counter_part;
    counter := counter / 32;
  end loop;

  return ts_part || machine_part || counter_part;
end;
$$;

-- =====================================================================
-- 2. ENUM TYPES
-- =====================================================================
create type peran_pengguna as enum ('admin', 'petugas', 'peminjam');
create type kondisi_alat as enum ('baik', 'rusak_ringan', 'rusak_berat');
create type status_peminjaman as enum ('diajukan', 'disetujui', 'ditolak', 'dikembalikan', 'terlambat');
create type status_pembayaran_denda as enum ('lunas', 'belum_lunas', 'bebas_denda');

-- =====================================================================
-- 3. TABEL
-- =====================================================================

-- pengguna — perluasan dari auth.users, id ikut uuid milik Supabase Auth
create table pengguna (
  id           uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text not null,
  peran        peran_pengguna not null default 'peminjam',
  created_at  timestamptz not null default now()
);

-- kategori alat
create table kategori (
  id          text primary key default generate_xid(),
  nama        text not null unique,
  created_at timestamptz not null default now()
);

-- alat
create table alat (
  id             text primary key default generate_xid(),
  nama           text not null,
  kategori_id    text not null references kategori(id) on delete restrict,
  stok_total     int not null check (stok_total >= 0),
  stok_tersedia  int not null check (stok_tersedia >= 0),
  kondisi        kondisi_alat not null default 'baik',
  created_at    timestamptz not null default now(),
  constraint chk_stok_tersedia_lte_total check (stok_tersedia <= stok_total)
);

create index idx_alat_kategori on alat(kategori_id);

-- peminjaman
create table peminjaman (
  id                  text primary key default generate_xid(),
  peminjam_id         uuid not null references pengguna(id) on delete cascade,
  alat_id             text not null references alat(id) on delete restrict,
  jumlah              int not null check (jumlah > 0),
  status              status_peminjaman not null default 'diajukan',
  tanggal_pinjam      timestamptz,
  tanggal_jatuh_tempo date not null,
  diajukan_pada       timestamptz not null default now(),
  disetujui_oleh      uuid references pengguna(id)
);

create index idx_peminjaman_peminjam on peminjaman(peminjam_id);
create index idx_peminjaman_alat on peminjaman(alat_id);
create index idx_peminjaman_status on peminjaman(status);

-- pengembalian
create table pengembalian (
  id                  text primary key default generate_xid(),
  peminjaman_id       text not null unique references peminjaman(id) on delete cascade,
  dikembalikan_pada   timestamptz not null default now(),
  kondisi_setelah     kondisi_alat not null,
  denda_keterlambatan numeric(12,2) not null default 0 check (denda_keterlambatan >= 0),
  denda_kerusakan     numeric(12,2) not null default 0 check (denda_kerusakan >= 0),
  jumlah_denda        numeric(12,2) not null default 0 check (jumlah_denda >= 0),
  status_pembayaran   status_pembayaran_denda not null default 'lunas',
  catatan             text,
  diverifikasi_oleh   uuid references pengguna(id)
);

-- log aktivitas
create table log_aktivitas (
  id           text primary key default generate_xid(),
  pengguna_id  uuid references pengguna(id),
  aksi         text not null,
  tabel_target text,
  id_target    text,
  created_at  timestamptz not null default now()
);

create index idx_log_pengguna on log_aktivitas(pengguna_id);

-- =====================================================================
-- 4. HELPER — cek peran pengguna yang sedang login
--    Dipakai berulang di RLS & function, jadi cukup didefinisikan sekali.
-- =====================================================================
create or replace function fn_peran_saya()
returns peran_pengguna
language sql
stable
as $$
  select peran from pengguna where id = auth.uid();
$$;

-- =====================================================================
-- 5. FUNCTION — pencatatan log aktivitas
-- =====================================================================
create or replace function fn_catat_log(
  p_aksi         text,
  p_tabel_target text default null,
  p_id_target    text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into log_aktivitas (pengguna_id, aksi, tabel_target, id_target)
  values (auth.uid(), p_aksi, p_tabel_target, p_id_target);
end;
$$;

-- =====================================================================
-- 6. FUNCTION — pengajuan peminjaman
--    Membuat baris baru di tabel peminjaman dengan status 'diajukan'.
--    Stok belum berkurang sampai disetujui oleh Petugas.
-- =====================================================================
create or replace function fn_ajukan_peminjaman(
  p_alat_id             text,
  p_jumlah              int,
  p_tanggal_jatuh_tempo date
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_peminjaman_id text;
  v_stok_tersedia int;
begin
  if fn_peran_saya() <> 'peminjam' then
    raise exception 'Hanya peminjam yang boleh mengajukan peminjaman';
  end if;

  select stok_tersedia into v_stok_tersedia
  from alat where id = p_alat_id;

  if v_stok_tersedia < p_jumlah then
    raise exception 'Stok alat tidak mencukupi';
  end if;

  insert into peminjaman (peminjam_id, alat_id, jumlah, status, tanggal_jatuh_tempo)
  values (auth.uid(), p_alat_id, p_jumlah, 'diajukan', p_tanggal_jatuh_tempo)
  returning id into v_peminjaman_id;

  perform fn_catat_log('mengajukan peminjaman', 'peminjaman', v_peminjaman_id);

  return v_peminjaman_id;
end;
$$;

-- =====================================================================
-- 7. FUNCTION — setujui / tolak peminjaman
--    Stok baru dikurangi saat Petugas menyetujui pengajuan peminjaman.
-- =====================================================================
create or replace function fn_setujui_peminjaman(p_peminjaman_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alat_id text;
  v_jumlah  int;
  v_baris   int;
begin
  if fn_peran_saya() not in ('petugas', 'admin') then
    raise exception 'Tidak memiliki izin menyetujui peminjaman';
  end if;

  select alat_id, jumlah into v_alat_id, v_jumlah
  from peminjaman
  where id = p_peminjaman_id and status = 'diajukan';

  if v_alat_id is null then
    raise exception 'Peminjaman tidak ditemukan atau sudah diproses';
  end if;

  -- Kurangi stok secara atomic
  update alat
  set stok_tersedia = stok_tersedia - v_jumlah
  where id = v_alat_id
    and stok_tersedia >= v_jumlah;

  get diagnostics v_baris = row_count;
  if v_baris = 0 then
    raise exception 'Stok alat tidak mencukupi untuk disetujui';
  end if;

  update peminjaman
  set status = 'disetujui',
      disetujui_oleh = auth.uid(),
      tanggal_pinjam = now()
  where id = p_peminjaman_id;

  perform fn_catat_log('menyetujui peminjaman', 'peminjaman', p_peminjaman_id);
end;
$$;

create or replace function fn_tolak_peminjaman(p_peminjaman_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if fn_peran_saya() not in ('petugas', 'admin') then
    raise exception 'Tidak memiliki izin menolak peminjaman';
  end if;

  update peminjaman
  set status = 'ditolak',
      disetujui_oleh = auth.uid()
  where id = p_peminjaman_id
    and status = 'diajukan';

  if not found then
    raise exception 'Peminjaman tidak ditemukan atau sudah diproses';
  end if;

  perform fn_catat_log('menolak peminjaman', 'peminjaman', p_peminjaman_id);
end;
$$;

-- =====================================================================
-- 9. FUNCTION — hitung denda keterlambatan (otomatis berdasarkan kuantitas)
-- =====================================================================
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

-- =====================================================================
-- 10. FUNCTION — proses pengembalian (termasuk verifikasi denda kerusakan)
--     Satu function membungkus: insert pengembalian + update status
--     peminjaman + kembalikan stok. Rollback otomatis jika ada error.
-- =====================================================================
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

  -- 1. Hitung denda keterlambatan otomatis
  v_denda_telat := fn_hitung_denda(p_peminjaman_id);

  -- 2. Taksiran denda kerusakan oleh petugas (hanya berlaku jika kondisi bukan baik)
  if p_kondisi = 'baik' then
    v_denda_rusak := 0;
  else
    v_denda_rusak := greatest(0, coalesce(p_denda_kerusakan, 0));
  end if;

  -- 3. Total denda
  v_total_denda := v_denda_telat + v_denda_rusak;

  -- 4. Status pembayaran (jika total 0, otomatis lunas)
  if v_total_denda = 0 then
    v_status_bayar := 'lunas';
  else
    v_status_bayar := coalesce(p_status_pembayaran, 'lunas');
  end if;

  insert into pengembalian (
    peminjaman_id, 
    kondisi_setelah, 
    denda_keterlambatan,
    denda_kerusakan,
    jumlah_denda, 
    status_pembayaran,
    catatan,
    diverifikasi_oleh
  )
  values (
    p_peminjaman_id, 
    p_kondisi, 
    v_denda_telat,
    v_denda_rusak,
    v_total_denda, 
    v_status_bayar,
    p_catatan,
    auth.uid()
  );

  update peminjaman set status = 'dikembalikan' where id = p_peminjaman_id;
  update alat set stok_tersedia = stok_tersedia + v_jumlah where id = v_alat_id;

  perform fn_catat_log('memproses pengembalian', 'peminjaman', p_peminjaman_id);
end;
$$;

-- =====================================================================
-- 10b. FUNCTION — pelunasan denda tertunggak
-- =====================================================================
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
-- 11. ROW LEVEL SECURITY
-- =====================================================================
alter table pengguna       enable row level security;
alter table kategori       enable row level security;
alter table alat           enable row level security;
alter table peminjaman     enable row level security;
alter table pengembalian   enable row level security;
alter table log_aktivitas  enable row level security;

-- pengguna
create policy "lihat_profil_sendiri" on pengguna for select
  using (id = auth.uid());
create policy "admin_kelola_pengguna" on pengguna for all
  using (fn_peran_saya() = 'admin')
  with check (fn_peran_saya() = 'admin');

-- kategori — semua role login boleh baca, hanya admin boleh ubah
create policy "semua_baca_kategori" on kategori for select
  using (auth.uid() is not null);
create policy "admin_kelola_kategori" on kategori for all
  using (fn_peran_saya() = 'admin')
  with check (fn_peran_saya() = 'admin');

-- alat — semua role login boleh baca, hanya admin boleh ubah
create policy "semua_baca_alat" on alat for select
  using (auth.uid() is not null);
create policy "admin_kelola_alat" on alat for all
  using (fn_peran_saya() = 'admin')
  with check (fn_peran_saya() = 'admin');

-- peminjaman — insert HANYA lewat fn_ajukan_peminjaman (security definer),
-- makanya sengaja tidak ada policy "for insert" di sini
create policy "peminjam_lihat_punya_sendiri" on peminjaman for select
  using (peminjam_id = auth.uid());
create policy "petugas_admin_lihat_semua_peminjaman" on peminjaman for select
  using (fn_peran_saya() in ('petugas', 'admin'));
create policy "petugas_admin_update_peminjaman" on peminjaman for update
  using (fn_peran_saya() in ('petugas', 'admin'));

-- pengembalian
create policy "petugas_admin_kelola_pengembalian" on pengembalian for all
  using (fn_peran_saya() in ('petugas', 'admin'))
  with check (fn_peran_saya() in ('petugas', 'admin'));
create policy "peminjam_lihat_pengembalian_sendiri" on pengembalian for select
  using (
    exists (
      select 1 from peminjaman pm
      where pm.id = pengembalian.peminjaman_id
        and pm.peminjam_id = auth.uid()
    )
  );

-- log_aktivitas — hanya admin yang boleh baca, insert cuma lewat fn_catat_log
create policy "admin_lihat_log" on log_aktivitas for select
  using (fn_peran_saya() = 'admin');

-- =====================================================================
-- 12. SKRIP MIGRASI (Jika Database Supabase Sudah Ada / Sedang Berjalan)
--     Jalankan blok ini di SQL Editor Supabase untuk meng-upgrade database
-- =====================================================================
-- do $$ begin
--   if not exists (select 1 from pg_type where typname = 'status_pembayaran_denda') then
--     create type status_pembayaran_denda as enum ('lunas', 'belum_lunas', 'bebas_denda');
--   end if;
-- end $$;
-- alter table pengembalian add column if not exists denda_keterlambatan numeric(12,2) not null default 0;
-- alter table pengembalian add column if not exists denda_kerusakan numeric(12,2) not null default 0;
-- alter table pengembalian add column if not exists status_pembayaran status_pembayaran_denda not null default 'lunas';
-- alter table pengembalian add column if not exists catatan text;