"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentUserAction, logoutAction } from "@/actions/auth";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userName?: string;
  roleLabel?: string;
}

export function DashboardLayout({ children, navItems, userName: initialUserName, roleLabel: initialRoleLabel }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{ nama_lengkap: string; peran: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const u = await getCurrentUserAction();
      if (u) {
        setUserProfile({
          nama_lengkap: u.nama_lengkap,
          peran: u.peran,
        });
      }
    }
    fetchUser();
  }, []);

  const displayName = userProfile?.nama_lengkap || initialUserName || "Pengguna";
  const displayRole = userProfile
    ? (userProfile.peran === "admin" ? "Administrator" : userProfile.peran === "petugas" ? "Petugas" : "Peminjam")
    : (initialRoleLabel || "User");

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <span className="text-xl tracking-tight">Aluna</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <div className={isActive ? "text-primary" : "text-muted-foreground"}>
                  {item.icon}
                </div>
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-primary/20">
            <AvatarFallback className="bg-primary/5 text-primary">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate">{displayRole}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-muted/10">
      <div className="hidden border-r bg-card md:block shadow-sm z-10 relative">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card/80 backdrop-blur-md px-4 lg:h-[60px] lg:px-6 sticky top-0 z-20 shadow-sm">
          <Sheet>
            <SheetTrigger render={
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              />
            }>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-[280px] p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              {/* Breadcrumb can go here */}
              {pathname.split('/').pop()?.replace('-', ' ')}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
