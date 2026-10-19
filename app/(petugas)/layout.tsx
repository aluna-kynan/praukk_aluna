"use client";

import { ClipboardCheck, ArrowLeftRight, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";

const PETUGAS_NAV = [
  { title: "Persetujuan Peminjaman", href: "/approvals", icon: <ClipboardCheck className="h-5 w-5" /> },
  { title: "Pantau Pengembalian", href: "/monitoring", icon: <ArrowLeftRight className="h-5 w-5" /> },
  { title: "Cetak Laporan", href: "/reports", icon: <FileText className="h-5 w-5" /> },
];

export default function PetugasLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout 
      navItems={PETUGAS_NAV} 
      userName="Siti Petugas" 
      roleLabel="Petugas"
    >
      {children}
    </DashboardLayout>
  );
}
