"use client";

import { Users, Wrench, FolderTree, Activity } from "lucide-react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";

const ADMIN_NAV = [
  { title: "Manajemen Pengguna", href: "/users", icon: <Users className="h-5 w-5" /> },
  { title: "Manajemen Alat", href: "/admin/tools", icon: <Wrench className="h-5 w-5" /> },
  { title: "Kategori", href: "/categories", icon: <FolderTree className="h-5 w-5" /> },
  { title: "Log Aktivitas", href: "/logs", icon: <Activity className="h-5 w-5" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout 
      navItems={ADMIN_NAV} 
      userName="Budi Admin" 
      roleLabel="Administrator"
    >
      {children}
    </DashboardLayout>
  );
}
