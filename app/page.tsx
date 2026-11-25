"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  RotateCcw,
  Users,
  Box,
  ArrowRight,
  Menu,
  X,
  Search,
  Sparkles,
  Check,
  ChevronRight,
  Laptop,
  Camera,
  Wrench,
  ShieldAlert,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* =========================================================================
          NAVBAR
      ========================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center p-1 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-colors">
                <Image
                  src="/assets/logo.png"
                  alt="SiDigi Logo"
                  width={140}
                  height={42}
                  priority
                  className="h-8 w-auto object-contain"
                />
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <Link
                href="#beranda"
                className="hover:text-primary transition-colors text-foreground"
              >
                Beranda
              </Link>
              <Link
                href="#manfaat"
                className="hover:text-primary transition-colors"
              >
                Manfaat & Benefit
              </Link>
              <Link
                href="#cara-kerja"
                className="hover:text-primary transition-colors"
              >
                Alur Peminjaman
              </Link>
              <Link
                href="#fitur"
                className="hover:text-primary transition-colors"
              >
                Fitur Unggulan
              </Link>
              <Link
                href="#peran"
                className="hover:text-primary transition-colors"
              >
                Peran Pengguna
              </Link>
            </nav>

            {/* Desktop Auth CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                  className:
                    "gap-2 px-5 py-2 rounded-full font-medium shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all",
                })}
              >
                <span>Masuk ke Sistem</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border/60 bg-background/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            <Link
              href="#beranda"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-muted text-foreground"
            >
              Beranda
            </Link>
            <Link
              href="#manfaat"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Manfaat & Benefit
            </Link>
            <Link
              href="#cara-kerja"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Alur Peminjaman
            </Link>
            <Link
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Fitur Unggulan
            </Link>
            <Link
              href="#peran"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Peran Pengguna
            </Link>
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={buttonVariants({
                  variant: "default",
                  className: "w-full justify-center gap-2 rounded-xl py-2.5",
                })}
              >
                <span>Masuk ke Sistem</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          MAIN CONTENT
      ========================================================================= */}
      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section
          id="beranda"
          className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32"
        >
          {/* Decorative Background Lighting */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-gradient-to-b from-primary/10 to-transparent blur-2xl" />
          </div>

          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Hero Copy & CTA */}
              <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Sistem Digital Peminjaman Alat Sekolah & Laboratorium</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                  Peminjaman Alat Jadi{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                    Lebih Cepat, Terdata,
                  </span>{" "}
                  & Bebas Masalah
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-muted-foreground font-normal max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  SiDigi menghadirkan kemudahan inventarisasi dan peminjaman alat laboratorium,
                  multimedia, dan bengkel. Hilangkan pencatatan manual berantakan dengan
                  pelacakan ketersediaan stok real-time serta validasi persetujuan terpusat.
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/login"
                    className={buttonVariants({
                      variant: "default",
                      size: "lg",
                      className:
                        "w-full sm:w-auto h-12 px-7 rounded-full text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 gap-2 transition-all",
                    })}
                  >
                    <span>Mulai Pinjam Sekarang</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="#manfaat"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className:
                        "w-full sm:w-auto h-12 px-7 rounded-full text-base font-semibold hover:bg-muted/80 gap-2 border-border/80",
                    })}
                  >
                    <span>Pelajari Manfaat</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>

                {/* Trust Highlights */}
                <div className="pt-6 border-t border-border/60 grid grid-cols-3 gap-4 text-left">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      100%
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Paperless & Digital
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      Real-Time
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Pelacakan Stok Alat
                    </div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      3 Tingkat
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Akses Khusus (Role)
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive UI Showcase Mockup */}
              <div className="lg:col-span-5 relative">
                {/* Glow behind card */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-3xl blur-2xl transform -rotate-1" />

                {/* Main Showcase Container */}
                <div className="relative rounded-2xl border border-border/80 bg-card/90 shadow-2xl p-5 sm:p-6 backdrop-blur-md space-y-4">
                  {/* Top Bar Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      ● Sistem Aktif & Siap Pakai
                    </span>
                  </div>

                  {/* Sample Tool Loan Card 1 */}
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300">
                          <Camera className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">
                            Sony Alpha A7 Mark III
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Kategori: Multimedia & Dokumentasi
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        Tersedia: 4 Unit
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40 text-muted-foreground">
                      <span>Kondisi Fisik: <strong>Sangat Baik</strong></span>
                      <span className="text-primary font-medium flex items-center gap-1">
                        Siap Diajukan <Check className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Sample Active Loan Tracker Card 2 */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          Status Pengajuan Terakhir
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Disetujui Petugas
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-background/70 border border-border/40">
                        <div className="text-[10px] text-muted-foreground">Peminjam</div>
                        <div className="font-semibold text-foreground truncate">Andi Pratama (XII RPL)</div>
                      </div>
                      <div className="p-2 rounded-lg bg-background/70 border border-border/40">
                        <div className="text-[10px] text-muted-foreground">Durasi</div>
                        <div className="font-semibold text-foreground">3 Hari (Tepat Waktu)</div>
                      </div>
                    </div>
                  </div>

                  {/* Live Validation Feature Pill */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs">
                    <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                    <p className="text-muted-foreground leading-tight">
                      <strong className="text-foreground">Proteksi Double-Booking:</strong> Kuota stok alat terpotong otomatis secara aman saat disetujui.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= BENEFIT SECTION ================= */}
        <section
          id="manfaat"
          className="py-20 md:py-28 bg-muted/30 border-y border-border/50 relative"
        >
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                <Zap className="h-3.5 w-3.5" />
                <span>Benefit & Keunggulan Nyata</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Mengapa SiDigi Jadi Solusi Terbaik untuk Peminjaman Alat?
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                Didesain khusus untuk mengatasi segala kendala pada sistem peminjaman konvensional,
                mulai dari alat hilang, stok bentrok, hingga pencatatan yang tidak sinkron.
              </p>
            </div>

            {/* 6 Benefit Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Benefit 1 */}
              <div className="group p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Cegah Double-Booking (Stok Akurat)
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sistem mengadopsi mekanisme validasi atomik. Stok berkurang saat peminjaman
                    disetujui dan kembali bertambah saat dikembalikan, mengeliminasi bentrok jadwal dua pengguna.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs font-medium text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Stok selalu terverifikasi otomatis</span>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="group p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <Clock className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Pelacakan Status Real-Time
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Peminjam dapat memantau posisi pengajuan secara transparan tanpa perlu bolak-balik
                    ke ruang sarpras atau laboratorium. Status pending, approved, hingga returned dapat dilihat langsung.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs font-medium text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Transparansi alur pengajuan 24/7</span>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="group p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Efisiensi Waktu Petugas & Siswa
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Proses persetujuan (approval) hanya membutuhkan satu klik dari dashboard Petugas.
                    Waktu antre berkurang drastis sehingga kegiatan praktikum dan belajar berjalan tepat waktu.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs font-medium text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approval instan tanpa birokrasi rumit</span>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="group p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Rekapitulasi & Laporan Otomatis
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tidak ada lagi pusing merekap data di akhir semester. Seluruh riwayat transaksi,
                    kondisi alat, serta log aktivitas tersimpan rapi dan siap dicetak menjadi laporan resmi.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs font-medium text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Audit data akurat dan siap cetak</span>
                </div>
              </div>

              {/* Benefit 5 */}
              <div className="group p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300">
                    <RotateCcw className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    100% Paperless & Ramah Lingkungan
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Selamat tinggal map berkas dan kertas formulir peminjaman yang rentan robek, basah, atau terselip.
                    Semua arsip tersimpan aman dalam database terpusat berbasis cloud.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs font-medium text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Hemat biaya kertas & ruang arsip</span>
                </div>
              </div>

              {/* Benefit 6 */}
              <div className="group p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    Hak Akses Aman Sesuai Role
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sistem mengisolasi wewenang secara ketat untuk Admin, Petugas, dan Peminjam.
                    Integritas data terjamin dengan proteksi tingkat database (Row Level Security).
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs font-medium text-primary flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Aman, terisolasi, dan berintegritas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WORKFLOW / ALUR PEMINJAMAN ================= */}
        <section id="cara-kerja" className="py-20 md:py-28">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <Layers className="h-3.5 w-3.5" />
                <span>Alur Kerja Praktis</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Cara Pinjam Alat Hanya dalam 4 Langkah Mudah
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                Tidak ada prosedur berbelit-belit. Siapapun dapat mengajukan peminjaman dalam hitungan menit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="relative p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm transition-all space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-md shadow-primary/25">
                  01
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Pilih Alat & Cek Stok
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Buka katalog alat, cari berdasarkan kategori (lab, multimedia, bengkel), dan lihat kuota stok yang tersedia saat ini.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm transition-all space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-md shadow-primary/25">
                  02
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Ajukan Peminjaman
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Isi tanggal peminjaman, estimasi tanggal pengembalian, dan jumlah alat yang dibutuhkan melalui form online.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm transition-all space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-md shadow-primary/25">
                  03
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Verifikasi Petugas
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Petugas sarpras/lab memeriksa permohonan peminjaman dan menyetujui (approve) secara instan.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative p-6 rounded-2xl bg-card border border-border/70 hover:border-primary/50 shadow-sm transition-all space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-md shadow-primary/25">
                  04
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Ambil & Kembalikan
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ambil alat di ruang lab. Setelah selesai, kembalikan alat untuk dicek kondisi fisiknya dan stok otomatis kembali normal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FITUR UNGGULAN ================= */}
        <section id="fitur" className="py-20 md:py-28 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Feature Text Info */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  <Box className="h-3.5 w-3.5" />
                  <span>Fitur Lengkap & Terintegrasi</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-snug">
                  Dibangun dengan Fitur yang Menjawab Kebutuhan Sekolah
                </h2>

                <p className="text-muted-foreground leading-relaxed">
                  Setiap modul di dalam aplikasi dirancang dengan alur kerja nyata di sekolah maupun
                  kampus, memastikan fleksibilitas bagi guru, siswa, teknisi lab, dan manajemen.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mt-1">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">
                        Manajemen Master Data Terstruktur
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Kelola data pengguna, kategori barang, dan spesifikasi alat tanpa batas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mt-1">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">
                        Pencatatan Kondisi Alat Saat Pengembalian
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Klasifikasi kondisi fisik (Baik, Rusak Ringan, Rusak Berat) untuk menjaga kualitas aset.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mt-1">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">
                        Pencarian Cepat & Filter Multi-Kategori
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Temukan alat yang dibutuhkan dalam hitungan detik dengan sistem filter responsif.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/login"
                    className={buttonVariants({
                      variant: "default",
                      className: "rounded-full px-6 gap-2",
                    })}
                  >
                    <span>Coba Sekarang</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Feature Grid Visual */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-foreground">Alat Lab & IT</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Laptop, proyektor LCD, router mikrotik, converter, kabel LAN, dan perangkat jaringan sekolah.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-foreground">Multimedia & DKV</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Kamera DSLR, lensa, tripod, stabilizer gimbal, lighting studio, dan microphone wireless.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-foreground">Peralatan Bengkel</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Toolkit elektronika, solder station, multimeter digital, mesin bor, dan peralatan teknis.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/70 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-foreground">Pencegahan Kehilangan</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Setiap barang yang keluar memiliki pemegang tanggung jawab jelas yang tertera dalam database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PERAN PENGGUNA ================= */}
        <section id="peran" className="py-20 md:py-28">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                <Users className="h-3.5 w-3.5" />
                <span>Multi-Role Access</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Satu Sistem untuk Semua Kebutuhan Pengguna
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg">
                SiDigi membagi wewenang ke dalam 3 peran agar kontrol dan tanggung jawab tetap jelas dan teratur.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Role Peminjam */}
              <div className="p-7 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 text-xs font-bold">
                    Peran 01
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Peminjam</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ditujukan untuk Siswa dan Guru yang memerlukan peralatan untuk kegiatan belajar mengajar atau proyek.
                  </p>
                  <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Melihat katalog alat & ketersediaan stok</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Mengajukan pinjaman secara online</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Memantau status & riwayat pinjaman</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Masuk sebagai Peminjam <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Role Petugas */}
              <div className="p-7 rounded-2xl bg-card border-2 border-primary/50 shadow-md hover:shadow-xl transition-all flex flex-col justify-between space-y-6 relative">
                <div className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider">
                  Pusat Operasional
                </div>
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 text-xs font-bold">
                    Peran 02
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Petugas / Laboran</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pengelola sarpras dan laboratorium yang bertugas memverifikasi fisik alat dan permohonan.
                  </p>
                  <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Menyetujui / menolak peminjaman</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Memantau tenggat & pengembalian</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Mencetak laporan peminjaman berkala</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Masuk sebagai Petugas <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Role Admin */}
              <div className="p-7 rounded-2xl bg-card border border-border/80 hover:border-primary/50 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 text-xs font-bold">
                    Peran 03
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Administrator</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pimpinan sistem yang memiliki kewenangan penuh atas master data dan audit aktivitas.
                  </p>
                  <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Kelola master user (tambah, edit, hapus)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Kelola master alat & kategori</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Memantau seluruh log aktivitas sistem</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Masuk sebagai Admin <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CALL TO ACTION (CTA) BANNER ================= */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-primary p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-black/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                  Mulai Pengalaman Peminjaman Alat yang Lebih Rapi Hari Ini
                </h2>
                <p className="text-blue-100 text-base sm:text-lg font-light leading-relaxed">
                  Tinggalkan formulir manual, percepat proses izin praktikum, dan jaga aset inventaris
                  sekolah dengan SiDigi.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-full px-8 h-12 shadow-lg transition-colors text-base"
                  >
                    Masuk ke Portal SiDigi
                  </Link>
                  <Link
                    href="#manfaat"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                      className:
                        "border-white/40 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full px-8 h-12 backdrop-blur-sm",
                    })}
                  >
                    Jelajahi Manfaat Lainnya
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          FOOTER
      ========================================================================= */}
      <footer className="border-t border-border/60 bg-card py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand column */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="inline-block">
                <div className="p-1.5 rounded-xl bg-primary/10 border border-primary/20 inline-block">
                  <Image
                    src="/assets/logo.png"
                    alt="SiDigi Logo"
                    width={130}
                    height={38}
                    className="h-8 w-auto object-contain"
                  />
                </div>
              </Link>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                SiDigi adalah platform sistem informasi peminjaman alat sekolah digital yang dirancang
                untuk meningkatkan efisiensi, akuntabilitas, dan keamanan inventaris sarana prasarana.
              </p>
              <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Terintegrasi dengan PostgreSQL & Supabase</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Navigasi
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#beranda" className="hover:text-primary transition-colors">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link href="#manfaat" className="hover:text-primary transition-colors">
                    Manfaat & Benefit
                  </Link>
                </li>
                <li>
                  <Link href="#cara-kerja" className="hover:text-primary transition-colors">
                    Alur Peminjaman
                  </Link>
                </li>
                <li>
                  <Link href="#fitur" className="hover:text-primary transition-colors">
                    Fitur Unggulan
                  </Link>
                </li>
                <li>
                  <Link href="#peran" className="hover:text-primary transition-colors">
                    Peran Pengguna
                  </Link>
                </li>
              </ul>
            </div>

            {/* Role Portals */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Portal Akses
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-primary transition-colors">
                    Portal Peminjam (Siswa/Guru)
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-primary transition-colors">
                    Portal Petugas (Approval)
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-primary transition-colors">
                    Portal Admin (Master Data)
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-primary transition-colors">
                    Masuk Akun
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support / Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Informasi
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Laboratorium Multimedia, Lab Rekayasa Perangkat Lunak, dan Bengkel Sarana Prasarana Sekolah.
              </p>
              <div className="text-xs text-muted-foreground pt-1">
                Jam Layanan Lab: <br />
                <strong className="text-foreground">Senin - Jumat: 07:00 - 16:00 WIB</strong>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} SiDigi (Sistem Peminjaman Alat). Hak Cipta Dilindungi.
            </p>
            <p className="text-center sm:text-right">
              Dikembangkan untuk Uji Kompetensi Keahlian (PRAUKK / UKK RPL).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
