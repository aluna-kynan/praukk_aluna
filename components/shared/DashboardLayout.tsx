"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LogOut, 
  Menu, 
  PanelLeft, 
  Sun, 
  Moon, 
  Bell, 
  HelpCircle, 
  Globe, 
  CheckCircle2, 
  User, 
  X,
  Clock,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  Loader2,
  Edit3,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCurrentUserAction, logoutAction } from "@/actions/auth";
import { updateSelfProfileAction } from "@/actions/users";
import { getRoleNotificationsAction, RoleNotification } from "@/actions/notifications";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
  const [userProfile, setUserProfile] = useState<{ id?: string; email?: string; nama_lengkap: string; peran: string } | null>(null);

  // Layout states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // Logout Confirmation state
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Real-time role-based notifications
  const [notifications, setNotifications] = useState<RoleNotification[]>([]);

  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    if (isNaN(diffMs) || diffMs < 0) return "Baru saja";
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Kemarin";
    return `${days} hr lalu`;
  };

  const loadNotifications = async (userId?: string) => {
    const data = await getRoleNotificationsAction();
    setNotifications(data);
    const seenKey = userId ? `notif_seen_at_${userId}` : "notif_seen_at";
    const lastSeen = localStorage.getItem(seenKey);
    if (!lastSeen) {
      setUnreadCount(data.length);
    } else {
      const lastSeenMs = new Date(lastSeen).getTime();
      const newer = data.filter((n) => new Date(n.timestamp).getTime() > lastSeenMs);
      setUnreadCount(newer.length);
    }
  };

  const markNotificationsRead = () => {
    const seenKey = userProfile?.id ? `notif_seen_at_${userProfile.id}` : "notif_seen_at";
    localStorage.setItem(seenKey, new Date().toISOString());
    setUnreadCount(0);
  };

  useEffect(() => {
    async function fetchUser() {
      const u = await getCurrentUserAction();
      if (u) {
        setUserProfile({
          id: u.id,
          email: u.email,
          nama_lengkap: u.nama_lengkap,
          peran: u.peran,
        });
        loadNotifications(u.id);
      }
    }
    fetchUser();

    // Check theme on load
    const isDarkMode = document.documentElement.classList.contains("dark") || 
      localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
    // Handle bfcache (Back/Forward Cache) when user clicks browser back button
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Realtime subscription + refresh saat pindah halaman
  useEffect(() => {
    if (!userProfile?.id) return;
    loadNotifications(userProfile.id);

    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`realtime-notif-${userProfile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "peminjaman" },
        () => loadNotifications(userProfile.id)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pengembalian" },
        () => loadNotifications(userProfile.id)
      );

    if (userProfile.peran === "admin") {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "log_aktivitas" },
        () => loadNotifications(userProfile.id)
      );
    }

    channel.subscribe();

    const interval = setInterval(() => {
      loadNotifications(userProfile.id);
    }, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, userProfile?.peran, pathname]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const displayName = userProfile?.nama_lengkap || initialUserName || "Pengguna";
  const displayRole = userProfile
    ? (userProfile.peran === "admin" ? "Administrator" : userProfile.peran === "petugas" ? "Petugas" : "Peminjam")
    : (initialRoleLabel || "User");
  
  const userHandle = userProfile?.email 
    ? `@${userProfile.email.split('@')[0]}`
    : `@${displayName.toLowerCase().replace(/\s+/g, '')}`;

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
    window.location.replace("/login");
  };

  const handleOpenProfile = () => {
    setEditNama(displayName);
    setEditPassword("");
    setEditConfirmPassword("");
    setProfileMsg(null);
    setIsEditingProfile(false);
    setIsProfileOpen(true);
  };

  const handleSaveSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (editPassword && editPassword.length < 6) {
      setProfileMsg({ type: "error", text: "Password baru minimal 6 karakter." });
      return;
    }

    if (editPassword && editPassword !== editConfirmPassword) {
      setProfileMsg({ type: "error", text: "Konfirmasi password baru tidak cocok." });
      return;
    }

    setIsSavingProfile(true);
    const formData = new FormData();
    formData.append("nama_lengkap", editNama);
    if (editPassword) {
      formData.append("password", editPassword);
    }

    const res = await updateSelfProfileAction(formData);
    if (res.error) {
      setProfileMsg({ type: "error", text: res.error });
    } else {
      if (res.nama_lengkap) {
        setUserProfile((prev) => prev ? { ...prev, nama_lengkap: res.nama_lengkap! } : prev);
      }
      setEditPassword("");
      setEditConfirmPassword("");
      setIsEditingProfile(false);
      setProfileMsg({ type: "success", text: "Profil berhasil diperbarui dan tercatat di log aktivitas." });
    }
    setIsSavingProfile(false);
  };

  // Sidebar content component (Desktop and Mobile)
  const SidebarBody = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Brand Logo Header */}
      <div className={cn(
        "flex h-16 items-center border-b px-4 transition-all duration-300",
        collapsed ? "justify-center" : "justify-between"
      )}>
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          {!collapsed ? (
            <Image
              src="/assets/logo.png"
              alt="Logo Aluna"
              width={150}
              height={44}
              priority
              className="h-9 w-auto object-contain transition-all"
            />
          ) : (
            <Image
              src="/assets/collapse.png"
              alt="Logo"
              width={36}
              height={36}
              priority
              className="h-8 w-8 object-contain"
            />
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1.5">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          if (collapsed) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger render={
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <div className={isActive ? "text-primary-foreground" : "text-muted-foreground"}>
                      {item.icon}
                    </div>
                  </Link>
                } />
                <TooltipContent side="right" className="font-medium text-xs">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <div className={isActive ? "text-primary-foreground" : "text-muted-foreground"}>
                {item.icon}
              </div>
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom section of Sidebar */}
      <div className="mt-auto p-3 border-t">
        {!collapsed ? (
          <Button
            variant="ghost"
            onClick={() => setIsHelpOpen(true)}
            className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground rounded-xl text-sm"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Bantuan</span>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsHelpOpen(true)}
                className="w-11 h-11 mx-auto rounded-xl text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            } />
            <TooltipContent side="right" className="text-xs">
              Bantuan
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted/10 font-sans">
      {/* Desktop Sidebar with Expand / Collapse */}
      <aside 
        className={cn(
          "hidden md:flex flex-col border-r bg-card shadow-xs transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-30",
          isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <SidebarBody collapsed={isCollapsed} />
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="flex h-16 items-center justify-between border-b bg-card/85 backdrop-blur-md px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
          {/* Left: Sidebar Toggle */}
          <div className="flex items-center gap-2">
            {/* Mobile Drawer Trigger */}
            <Sheet>
              <SheetTrigger render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Buka Menu</span>
                </Button>
              } />
              <SheetContent side="left" className="flex flex-col w-[280px] p-0">
                <SidebarBody collapsed={false} />
              </SheetContent>
            </Sheet>

            {/* Desktop Expand / Collapse Button */}
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden md:flex h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              } />
              <TooltipContent side="bottom" className="text-xs">
                {isCollapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Right: Actions Row (Theme, Notifications, Help, Lang, Profile Dropdown) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* 1. Theme Toggle */}
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
                  <span className="sr-only">Tema Gelap / Terang</span>
                </Button>
              } />
              <TooltipContent side="bottom" className="text-xs">
                {isDark ? "Mode Terang" : "Mode Gelap"}
              </TooltipContent>
            </Tooltip>

            {/* 2. Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                  <span className="sr-only">Notifikasi</span>
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-80 p-2 shadow-xl rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-md">
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markNotificationsRead}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator className="my-1.5" />
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => {
                      const icon =
                        n.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : n.type === "danger" ? (
                          <AlertTriangle className="h-4 w-4 text-rose-500" />
                        ) : n.type === "success" ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-500" />
                        );
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationsRead();
                            router.push(n.href);
                          }}
                          className="p-2.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer text-xs flex gap-3"
                        >
                          <div className="mt-0.5 shrink-0">{icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-foreground truncate">{n.title}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {formatRelativeTime(n.timestamp)}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-0.5 leading-relaxed">{n.desc}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Tidak ada notifikasi baru.
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 3. Help Button */}
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsHelpOpen(true)}
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">Pusat Bantuan</span>
                </Button>
              } />
              <TooltipContent side="bottom" className="text-xs">
                Bantuan & Panduan
              </TooltipContent>
            </Tooltip>

            {/* 4. Language / Globe */}
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hidden sm:flex"
                >
                  <Globe className="h-4 w-4" />
                  <span className="sr-only">Bahasa</span>
                </Button>
              } />
              <TooltipContent side="bottom" className="text-xs">
                Indonesia (ID)
              </TooltipContent>
            </Tooltip>

            {/* 5. User Profile Dropdown (Matching Reference Image) */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 transition-transform active:scale-95 ml-1 p-0.5">
                  <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-xs cursor-pointer">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              } />
              <DropdownMenuContent align="end" className="w-64 p-2 shadow-xl rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-md">
                {/* User Header Profile */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 mb-1">
                  <Avatar className="h-10 w-10 border border-primary/20 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {userHandle}
                    </span>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1.5" />

                {/* Profil Item */}
                <DropdownMenuItem 
                  onClick={handleOpenProfile}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-muted"
                >
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>Profil</span>
                </DropdownMenuItem>

                {/* Notifikasi Item */}
                <DropdownMenuItem 
                  onClick={markNotificationsRead}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-muted"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span>Notifikasi</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5" />

                {/* Keluar Item */}
                <DropdownMenuItem 
                  onClick={() => setIsLogoutConfirmOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-sm font-medium text-destructive hover:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 text-destructive" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Modal Pusat Bantuan */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border/60 p-6 space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Pusat Bantuan & Panduan</h3>
                  <p className="text-xs text-muted-foreground">Sistem Peminjaman Alat Aluna</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsHelpOpen(false)} className="rounded-lg h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-500" /> Aturan Durasi Peminjaman
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Durasi standar peminjaman alat adalah <strong>maksimal 5 hari</strong> terhitung sejak tanggal disetujui.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Denda Keterlambatan
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pengembalian melebihi tanggal jatuh tempo dikenakan denda otomatis sebesar <strong>Rp 5.000 / hari</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-green-500" /> Alur & Stok Alat
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Stok alat di sistem hanya berkurang saat pengajuan disetujui oleh Petugas. Saat dikembalikan dan diverifikasi fisiknya, stok otomatis kembali ke database.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Profil */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border/60 p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-lg text-foreground">
                {isEditingProfile ? "Ubah Profil & Password" : "Profil Pengguna"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProfileOpen(false)}
                className="rounded-lg h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {profileMsg && (
              <div
                className={cn(
                  "p-3 rounded-lg text-xs font-medium",
                  profileMsg.type === "error"
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                )}
              >
                {profileMsg.text}
              </div>
            )}

            {!isEditingProfile ? (
              <>
                <div className="flex flex-col items-center py-2 text-center">
                  <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-md mb-3">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="text-lg font-bold text-foreground">{displayName}</h4>
                  <p className="text-xs text-muted-foreground">{userHandle}</p>
                  <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {displayRole}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/50">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Peran Akses</span>
                    <span className="font-semibold text-foreground">{displayRole}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Email / Username</span>
                    <span className="font-semibold text-foreground">{userProfile?.email || userHandle}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Status Akun</span>
                    <span className="font-semibold text-green-600">Aktif & Terverifikasi</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(true);
                      setEditNama(displayName);
                    }}
                    className="rounded-xl px-4 text-xs gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Ubah Profil & Password
                  </Button>
                  <Button onClick={() => setIsProfileOpen(false)} className="rounded-xl px-4 text-xs">
                    Selesai
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSaveSelfProfile} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Lengkap</Label>
                  <Input
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    placeholder="Nama lengkap"
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Password Baru (Opsional)</Label>
                  <Input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Minimal 6 karakter (kosongkan jika tidak ubah)"
                    className="h-9 text-sm"
                  />
                </div>

                {editPassword && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Konfirmasi Password Baru</Label>
                    <Input
                      type="password"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      className="h-9 text-sm"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileMsg(null);
                    }}
                    className="rounded-xl px-4 text-xs"
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSavingProfile} className="rounded-xl px-4 text-xs">
                    {isSavingProfile ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Logout */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border/60 p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive shrink-0">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Konfirmasi Keluar</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Apakah Anda yakin ingin keluar dari sistem?
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Sesi Anda akan diakhiri. Anda perlu memasukkan email dan password kembali untuk mengakses data.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-xl px-4 text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="rounded-xl px-4 text-xs gap-1.5"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Ya, Keluar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
