"use client";

import { PackageSearch, History } from "lucide-react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";

const PEMINJAM_NAV = [
  { title: "Katalog Alat", href: "/tools", icon: <PackageSearch className="h-5 w-5" /> },
  { title: "Pinjamanku", href: "/my-loans", icon: <History className="h-5 w-5" /> },
];

export default function PeminjamLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout 
      navItems={PEMINJAM_NAV} 
      userName="Andi Peminjam" 
      roleLabel="Peminjam"
    >
      {children}
    </DashboardLayout>
  );
}
