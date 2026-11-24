-- Jalankan setelah skema dasar dan migration-denda.sql.
-- Tambahkan status permintaan dan waktu pengajuan pengembalian.
alter table peminjaman
  add column if not exists status_pengembalian text
    check (status_pengembalian is null or status_pengembalian in ('menunggu_verifikasi', 'selesai')),
  add column if not exists pengembalian_diajukan_pada timestamptz;

create index if not exists idx_peminjaman_pengembalian_menunggu
  on peminjaman (pengembalian_diajukan_pada)
  where status_pengembalian = 'menunggu_verifikasi';

-- Hanya peminjam pemilik pinjaman yang masih aktif dapat mengajukan pengembalian.
create or replace function fn_ajukan_pengembalian(p_peminjaman_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if fn_peran_saya() is distinct from 'peminjam'::peran_pengguna then
    raise exception 'Hanya peminjam yang boleh mengajukan pengembalian';
  end if;

  update peminjaman
  set status_pengembalian = 'menunggu_verifikasi',
      pengembalian_diajukan_pada = now()
  where id = p_peminjaman_id
    and peminjam_id = auth.uid()
    and status in ('disetujui', 'terlambat')
    and status_pengembalian is null;

  if not found then
    raise exception 'Peminjaman tidak ditemukan, belum aktif, atau pengembalian sudah diajukan';
  end if;

  perform fn_catat_log('mengajukan pengembalian', 'peminjaman', p_peminjaman_id);
end;
$$;

-- Pengembalian final hanya dapat diproses setelah permintaan peminjam ditinjau.
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
  if fn_peran_saya() is null or fn_peran_saya() not in ('petugas', 'admin') then
    raise exception 'Tidak memiliki izin memproses pengembalian';
  end if;

  select alat_id, jumlah into v_alat_id, v_jumlah
  from peminjaman
  where id = p_peminjaman_id
    and status in ('disetujui', 'terlambat')
    and status_pengembalian = 'menunggu_verifikasi';

  if v_alat_id is null then
    raise exception 'Pengajuan pengembalian tidak ditemukan atau sudah diproses';
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

  update peminjaman
  set status = 'dikembalikan',
      status_pengembalian = 'selesai'
  where id = p_peminjaman_id;

  update alat set stok_tersedia = stok_tersedia + v_jumlah where id = v_alat_id;
  perform fn_catat_log('memproses pengembalian', 'peminjaman', p_peminjaman_id);
end;
$$;
