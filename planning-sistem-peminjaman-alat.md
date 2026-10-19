# Planning Sistem — Aplikasi Peminjaman Alat
**Stack: Next.js 16 (App Router, TypeScript, Turbopack) + Supabase (PostgreSQL, Auth, RLS)**

> **Revisi:** Alur pengurangan stok diperbaiki menjadi pola **atomic reserve-then-release** (lihat bagian 7b & 8) untuk menghindari bug double-decrement dan race condition saat dua peminjam mengajukan alat yang sama secara bersamaan.

---

## 1. Ringkasan Proyek

Aplikasi web untuk mengelola peminjaman alat dengan 3 level pengguna:

| Role | Deskripsi Singkat |
|---|---|
| **Admin** | Kelola master data (user, alat, kategori), lihat log aktivitas |
| **Petugas** | Approve peminjaman, pantau pengembalian, cetak laporan |
| **Peminjam** | Lihat daftar alat, ajukan peminjaman, kembalikan alat |

Metode pengembangan: **Prototype** (lebih cocok dari Waterfall murni karena butuh iterasi cepat untuk validasi UI dengan 3 role berbeda), tapi dokumentasi tetap mengikuti struktur 5 tahap yang diminta soal (Analisis → Desain → Implementasi → Pengujian → Dokumentasi).

---

## 2. Tech Stack & Justifikasi

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend + Backend | **Next.js 16 (App Router)** + TypeScript, bundler **Turbopack** (default) | Server Actions menggantikan kebutuhan REST API terpisah, cocok untuk CRUD + role-based page |
| Database | **Supabase (PostgreSQL)** | Native RLS untuk kontrol akses per role di level DB, bukan cuma di frontend |
| Auth | **Supabase Auth** (email/password) | Sudah terintegrasi dengan RLS via `auth.uid()` |
| ORM/Query | **Supabase JS Client** (`@supabase/ssr` untuk SSR-safe cookies) | Standar industri untuk Next.js + Supabase |
| Validasi | **Zod** | Validasi input di Server Action sebelum ke DB |
| UI | **Tailwind CSS + shadcn/ui** | Konsisten, cepat, mudah didokumentasikan |
| State Table/Form | **TanStack Table** + **React Hook Form** | Standar untuk CRUD dashboard |
| Testing | **Playwright** (E2E) + Vitest (unit) | Sesuai kebutuhan "5 skenario uji" di soal |

Catatan: karena kamu sudah biasa dengan Supabase Realtime dari GameForSmart, kamu bisa pakai Realtime channel juga untuk notifikasi status peminjaman (misal Petugas dapat notif real-time saat ada pengajuan baru) — opsional, nilai tambah tapi tidak wajib di soal.

### Hal yang berubah di Next.js 16 (perlu diperhatikan saat implementasi)

| Perubahan | Dampak ke proyek ini |
|---|---|
| `middleware.ts` → **`proxy.ts`** | File guard auth/role di bagian 5 & 6 harus dinamai `proxy.ts`, bukan `middleware.ts` |
| `params` & `searchParams` jadi **Promise** (wajib `await`) | Semua dynamic route (`/return/[loanId]`, dll) harus `async` dan `await params` |
| **Cache Components** — `"use cache"` sekarang eksplisit (opt-in), bukan implisit lagi | Tandai halaman/komponen yang perlu di-cache secara sadar (mis. daftar kategori jarang berubah → cache; daftar stok alat → jangan di-cache karena berubah sering) |
| **Turbopack** jadi bundler default (dev & build) | Tidak perlu setup tambahan, tapi pastikan semua dependency kompatibel |
| **React Compiler** stabil, auto-memoization | Tidak perlu manual `useMemo`/`useCallback` berlebihan di komponen dashboard tabel |
| `next lint` dihapus | Pakai ESLint langsung (`eslint .`) untuk linting, bukan `next lint` |
| Prop lama `next/image` (`priority` lama, `onLoadingComplete`, dll) dihapus | Perhatikan saat render foto/ikon alat, sesuaikan dengan API `next/image` terbaru |

Struktur folder di bagian 6 sudah disesuaikan dengan perubahan ini.

---

## 3. Analisis Kebutuhan (Functional Requirements)

Diturunkan langsung dari tabel fitur di soal:

**Admin**: Login/Logout, CRUD User, CRUD Alat, CRUD Kategori, CRUD Data Peminjaman, CRUD Pengembalian, Log Aktivitas

**Petugas**: Login/Logout, Menyetujui Peminjaman, Memantau Pengembalian, Mencetak Laporan

**Peminjam**: Login/Logout, Melihat Daftar Alat, Mengajukan Peminjaman, Mengembalikan Alat

Non-functional requirements (poin "Perhatikan" di soal):
- Query efisien → pakai `.select()` dengan kolom spesifik (bukan `select('*')`), pagination via `.range()`
- Hindari looping query → gunakan single query dengan `JOIN`/`in()`, hindari N+1 pada list alat
- Limit data besar → pagination wajib di semua tabel list (default 10-20 baris/halaman)

---

## 4. Desain — Struktur Data & ERD

### Entitas Utama

```
users (extends auth.users)
├── id (uuid, PK, FK -> auth.users.id)
├── full_name (text)
├── role (enum: 'admin' | 'petugas' | 'peminjam')
├── created_at (timestamptz)

categories
├── id (uuid, PK)
├── name (text)
├── created_at

tools (alat)
├── id (uuid, PK)
├── name (text)
├── category_id (FK -> categories.id)
├── stock_total (int)
├── stock_available (int)
├── condition (enum: 'baik' | 'rusak_ringan' | 'rusak_berat')
├── created_at

loans (peminjaman)
├── id (uuid, PK)
├── borrower_id (FK -> users.id)
├── tool_id (FK -> tools.id)
├── quantity (int)
├── status (enum: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue')
├── borrowed_at (timestamptz, nullable — diisi saat approve)
├── due_date (date)
├── requested_at (timestamptz)
├── approved_by (FK -> users.id, nullable)

returns (pengembalian)
├── id (text/uuid, PK)
├── loan_id (FK -> loans.id)
├── returned_at (timestamptz)
├── condition_after (enum: 'baik' | 'rusak_ringan' | 'rusak_berat')
├── late_fine (denda_keterlambatan: numeric, default 0)
├── damage_fine (denda_kerusakan: numeric, default 0)
├── fine_amount (jumlah_denda: total gabungan, numeric, default 0)
├── payment_status (status_pembayaran: enum 'lunas' | 'belum_lunas' | 'bebas_denda')
├── notes (catatan: text, nullable)
├── verified_by (FK -> users.id, nullable)

activity_logs
├── id (uuid, PK)
├── user_id (FK -> users.id)
├── action (text)
├── target_table (text)
├── target_id (uuid)
├── created_at (timestamptz)
```

### Relasi (ERD ringkas)
```
users (1)───(N) loans          [borrower_id]
users (1)───(N) loans          [approved_by, nullable]
tools (1)───(N) loans
loans (1)───(1) returns
categories (1)───(N) tools
users (1)───(N) activity_logs
```

Untuk diagram visual ERD (kotak-panah), gambar ulang struktur di atas pakai **dbdiagram.io** atau **draw.io** lalu screenshot untuk lampiran dokumentasi — ini bagian dari deliverable poin 3a di soal.

---

## 5. Role-Based Access Control (RBAC)

Dua lapis kontrol akses, standar industri (defense in depth):

**Lapis 1 — Next.js Proxy** (dulu disebut Middleware; UX, redirect cepat)
```ts
// proxy.ts (root project, menggantikan middleware.ts di Next.js 16)
// Cek session Supabase, redirect ke /login jika belum auth
// Cek role dari custom claim/table users, redirect ke halaman
// sesuai role jika akses path yang tidak diizinkan (mis. /admin/* )
```

**Lapis 2 — Supabase Row Level Security (RLS)** (keamanan sebenarnya, tidak bisa dibypass dari client)

Contoh policy inti:
```sql
-- Peminjam hanya boleh lihat & buat loans miliknya sendiri
create policy "peminjam_select_own_loans"
on loans for select
using (borrower_id = auth.uid());

create policy "peminjam_insert_loan"
on loans for insert
with check (borrower_id = auth.uid());

-- Petugas & Admin bisa lihat semua loans
create policy "petugas_admin_select_all_loans"
on loans for select
using (
  exists (
    select 1 from users
    where users.id = auth.uid()
    and users.role in ('petugas','admin')
  )
);

-- Hanya Petugas/Admin boleh update status (approve/reject)
create policy "petugas_admin_update_loan_status"
on loans for update
using (
  exists (select 1 from users where users.id = auth.uid() and users.role in ('petugas','admin'))
);
```

Prinsip: **jangan pernah percaya frontend saja** — walau tombol "Approve" disembunyikan dari UI Peminjam, RLS tetap harus menolak request-nya di level DB.

---

## 6. Arsitektur Aplikasi (Struktur Folder Next.js)

```
proxy.ts                        # (dulu middleware.ts) — guard auth & role di edge
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── logout/route.ts
│   ├── (admin)/
│   │   ├── layout.tsx          # guard: role !== 'admin' -> redirect
│   │   ├── users/page.tsx
│   │   ├── tools/page.tsx
│   │   ├── categories/page.tsx
│   │   └── logs/page.tsx
│   ├── (petugas)/
│   │   ├── layout.tsx          # guard: role !== 'petugas'
│   │   ├── approvals/page.tsx
│   │   ├── monitoring/page.tsx
│   │   └── reports/page.tsx
│   ├── (peminjam)/
│   │   ├── layout.tsx          # guard: role !== 'peminjam'
│   │   ├── tools/page.tsx
│   │   ├── my-loans/page.tsx
│   │   └── return/[loanId]/page.tsx   # params sekarang Promise, wajib `await params`
│   └── layout.tsx
├── actions/                    # Server Actions (pengganti REST API)
│   ├── auth.ts
│   ├── tools.ts
│   ├── loans.ts
│   ├── returns.ts
│   └── logs.ts
├── lib/
│   ├── supabase/
│   │   ├── server.ts           # client untuk Server Component/Action
│   │   ├── client.ts           # client untuk Client Component
│   │   └── proxy-helpers.ts    # helper auth dipakai proxy.ts
│   ├── validations/            # Zod schema per entitas
│   └── utils.ts
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   └── shared/                 # DataTable, ConfirmDialog, dll
└── types/
    └── database.types.ts       # generated via `supabase gen types typescript`
```

---

## 7. Alur Proses Utama (deskripsi flowchart, poin 3 di soal)

**a. Proses Login**
```
Start → Input email/password → Submit ke Supabase Auth
  → Sukses? 
     Ya → Ambil role dari tabel users → Redirect sesuai role
     Tidak → Tampilkan notifikasi "Email/password salah" → kembali ke form
```

**b. Proses Peminjaman Alat**
```
Start (Peminjam) → Pilih alat → Input jumlah & tanggal pengembalian → Submit
  → Server Action validasi (Zod) → Panggil RPC fn_request_loan()
     (cek stock_available >= qty DAN kurangi stok dalam satu statement atomic)
  → Berhasil?
     Tidak (stok tidak cukup) → Tampilkan "Stok tidak mencukupi" → End
     Ya → loans terisi (status: pending), stok sudah tereservasi
        → Notifikasi ke Petugas → End
```
*Catatan: stok direservasi saat pengajuan (bukan saat approve). Jika petugas menolak, stok dikembalikan otomatis lewat trigger (lihat bagian 8) — bukan dikurangi lagi saat approve.*

**c. Proses Pengembalian & Perhitungan Denda Multi-Komponen**
```
Start (Peminjam ajukan kembali) → Petugas cek kondisi fisik alat
  → Petugas pilih condition_after ('baik' | 'rusak_ringan' | 'rusak_berat')
  → Sistem hitung denda keterlambatan otomatis:
      hari_telat = greatest(0, today - due_date)
      denda_telat = hari_telat × tarif_per_hari × quantity
  → Kondisi fisik rusak?
      Ya → Petugas input taksiran biaya kerusakan riil + catatan
      Tidak → denda_kerusakan = 0
  → Total Denda = denda_telat + denda_kerusakan
  → Total Denda > 0?
      Ya → Petugas pilih status_pembayaran ('lunas' / 'belum_lunas' / 'bebas_denda')
      Tidak → status_pembayaran = 'lunas'
  → Simpan ke returns (atomic) → Update loans.status = 'returned'
  → Update tools.stock_available += quantity
  → Insert activity_logs → End
```
*Catatan: Sistem menerapkan Human-in-the-loop: Keterlambatan dihitung otomatis oleh sistem, sedangkan biaya kerusakan di-asses langsung oleh petugas sesuai kondisi fisik lapangan.*

---

## 8. Database Layer — Trigger, Function, Stored Procedure

Sesuai instruksi soal (poin 6), berikut contoh implementasi di Supabase.

**Prinsip (standar industri — atomic reserve-then-release):**
- Stok hanya boleh dimutasi lewat **satu jalur**, dalam **satu transaksi atomic** — bukan tersebar di beberapa function/trigger untuk event yang berbeda.
- Reservasi terjadi **saat pengajuan** (`pending`), bukan saat approve — supaya approve tidak perlu menyentuh stok lagi.
- Cek-dan-kurangi dilakukan dalam **satu statement `UPDATE ... WHERE`**, bukan *read-then-write* terpisah, supaya bebas race condition saat dua peminjam mengajukan alat yang sama bersamaan.
- `CHECK constraint` di level DB sebagai jaring pengaman terakhir kalau ada bug di logic aplikasi.

```sql
-- Jaring pengaman: stok tidak boleh negatif
alter table tools
  add constraint chk_stock_non_negative check (stock_available >= 0);
```

**Function: satu-satunya jalur untuk membuat pengajuan peminjaman (reservasi atomic)**
```sql
create or replace function fn_request_loan(
  p_borrower_id uuid,
  p_tool_id uuid,
  p_quantity int,
  p_due_date date
) returns uuid
language plpgsql
as $$
declare
  v_loan_id uuid;
  v_rows_affected int;
begin
  -- Atomic check-and-decrement: baca & kurangi dalam satu statement
  update tools
  set stock_available = stock_available - p_quantity
  where id = p_tool_id
    and stock_available >= p_quantity;

  get diagnostics v_rows_affected = row_count;

  if v_rows_affected = 0 then
    raise exception 'Stok tidak mencukupi';
  end if;

  insert into loans (borrower_id, tool_id, quantity, status, due_date, requested_at)
  values (p_borrower_id, p_tool_id, p_quantity, 'pending', p_due_date, now())
  returning id into v_loan_id;

  return v_loan_id;
exception when others then
  raise; -- transaksi otomatis rollback (update tools + insert loans batal bersama)
end;
$$;
```

**Trigger: kembalikan stok hanya saat pengajuan ditolak** (approve tidak lagi menyentuh stok — sudah direservasi di atas)
```sql
create or replace function fn_release_stock_on_reject()
returns trigger as $$
begin
  if new.status = 'rejected' and old.status = 'pending' then
    update tools
    set stock_available = stock_available + new.quantity
    where id = new.tool_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_release_stock
before update on loans
for each row execute function fn_release_stock_on_reject();
```

**Function: hitung denda keterlambatan otomatis (berdasarkan kuantitas)**
```sql
create or replace function fn_calculate_fine(p_loan_id uuid)
returns numeric as $$
declare
  v_due_date date;
  v_qty int;
  v_days_late int;
  v_rate numeric := 5000; -- tarif per hari per unit
begin
  select due_date, quantity into v_due_date, v_qty from loans where id = p_loan_id;
  v_days_late := greatest(0, (current_date - v_due_date));
  return v_days_late * v_rate * coalesce(v_qty, 1);
end;
$$ language plpgsql;
```

**Stored Procedure / Function: proses pengembalian multi-komponen & transaksi atomic**
```sql
create or replace procedure sp_process_return(
  p_loan_id uuid,
  p_condition text,
  p_damage_fee numeric default 0,
  p_payment_status text default 'lunas',
  p_notes text default null,
  p_verified_by uuid default null
)
language plpgsql
as $$
declare
  v_late_fine numeric;
  v_damage_fine numeric := 0;
  v_total_fine numeric;
  v_tool_id uuid;
  v_qty int;
begin
  select fn_calculate_fine(p_loan_id) into v_late_fine;
  select tool_id, quantity into v_tool_id, v_qty from loans where id = p_loan_id;

  if p_condition <> 'baik' then
    v_damage_fine := greatest(0, coalesce(p_damage_fee, 0));
  end if;

  v_total_fine := v_late_fine + v_damage_fine;

  insert into returns (
    loan_id, returned_at, condition_after, 
    late_fine, damage_fine, fine_amount, payment_status, notes, verified_by
  )
  values (
    p_loan_id, now(), p_condition, 
    v_late_fine, v_damage_fine, v_total_fine, p_payment_status, p_notes, p_verified_by
  );

  update loans set status = 'returned' where id = p_loan_id;
  update tools set stock_available = stock_available + v_qty where id = v_tool_id;

  commit;
exception when others then
  rollback;
  raise;
end;
$$;
```

---

## 9. Optimasi Query (poin "Perhatikan" di soal)

- Selalu `.select('id, name, stock_available')` — jangan `select('*')`
- Pagination wajib: `.range((page-1)*limit, page*limit - 1)`
- Hindari loop-query (mis. loop per loan untuk ambil nama alat) → pakai join:
  ```ts
  supabase.from('loans').select('*, tools(name), users!borrower_id(full_name)')
  ```
- Index kolom yang sering di-filter: `tool_id`, `borrower_id`, `status`
- Gunakan `count: 'exact'` hanya saat perlu total row (mahal), bukan di setiap fetch
- Pengajuan peminjaman **wajib** lewat `supabase.rpc('fn_request_loan', {...})`, bukan `.insert()` langsung ke tabel `loans` — supaya logic reservasi atomic di bagian 8 tidak bisa dilewati dari client

---

## 10. Rencana Pengujian (poin 9, minimal 5 skenario)

| No | Kasus | Input | Hasil yang Diharapkan |
|---|---|---|---|
| 1 | Login user salah | username/password salah | Gagal login, muncul notifikasi error |
| 2 | Tambah alat | Data alat valid (Admin) | Alat tersimpan, muncul di daftar |
| 3 | Pinjam alat stok habis | Ajukan pinjam alat stock_available = 0 | RPC `fn_request_loan` gagal (`Stok tidak mencukupi`), tidak ada baris loans baru |
| 4 | Kembalikan alat telat | Return setelah due_date | fine_amount terhitung otomatis sesuai hari telat |
| 5 | Akses privilege | Peminjam akses `/admin/users` | Ditolak (redirect / 403), RLS juga menolak query langsung |
| 6 | Approve peminjaman | Petugas approve loan pending | Status jadi approved, stock_available **tidak berubah** (sudah direservasi saat pengajuan) |
| 7 | Tolak peminjaman | Petugas reject loan pending | Status jadi rejected, stock_available bertambah kembali (dilepas oleh trigger) |
| 8 | Race condition stok terakhir | 2 peminjam ajukan alat stock_available = 1 bersamaan | Hanya 1 yang berhasil (loans terbuat), 1 lagi gagal dengan "Stok tidak mencukupi" |

---

## 11. Fase Pengembangan (Timeline Kerja)

| Fase | Deliverable | Estimasi |
|---|---|---|
| 1. Analisis Kebutuhan | Dokumen requirement (bagian 3 di atas) | 0.5 hari |
| 2. Desain | ERD + wireframe 3 role + skema DB | 1 hari |
| 3. Setup & Auth | Init Next.js+Supabase, RLS dasar, login/logout | 0.5 hari |
| 4. Implementasi Admin | CRUD user/alat/kategori, log aktivitas | 1 hari |
| 5. Implementasi Petugas | Approval, monitoring, laporan | 1 hari |
| 6. Implementasi Peminjam | Lihat alat, ajukan, kembalikan | 1 hari |
| 7. Trigger/Function/SP DB | Sesuai bagian 8 | 0.5 hari |
| 8. Pengujian | 5+ skenario di bagian 10 | 0.5 hari |
| 9. Dokumentasi & Laporan | ERD, deskripsi program, debugging log, screenshot | 0.5 hari |

---

## 12. Checklist Deliverable (sesuai poin V di soal)

- [ ] Folder proyek Next.js (kode lengkap)
- [ ] File `.sql` export schema Supabase (`supabase db dump`)
- [ ] Dokumentasi ERD (gambar/diagram)
- [ ] Deskripsi program (per fitur/role)
- [ ] Dokumentasi fungsi/prosedur (input-proses-output tiap Server Action)
- [ ] Log debugging (bug ditemukan + cara perbaikan)
- [ ] Screenshot hasil pengujian per skenario di bagian 10

---