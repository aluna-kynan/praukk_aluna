"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Loader2, Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  getUsers,
  updateUserRole,
  updateUserPassword,
  createUserAction,
  deleteUser,
} from "@/actions/users";
import { getPeranLabel } from "@/lib/status-mapper";
import { PeranPengguna } from "@/types/database.types";

type FilterPeran = "semua" | PeranPengguna;

const FILTER_TABS: { value: FilterPeran; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "admin", label: "Administrator" },
  { value: "petugas", label: "Petugas" },
  { value: "peminjam", label: "Peminjam" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPeran, setFilterPeran] = useState<FilterPeran>("semua");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal: Tambah Pengguna
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [peran, setPeran] = useState<PeranPengguna>("peminjam");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal: Reset Password
  const [pwModal, setPwModal] = useState<{ id: string; nama: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Modal: Konfirmasi Hapus Pengguna
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadData = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = u.nama_lengkap
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchPeran =
        filterPeran === "semua" || u.peran === filterPeran;
      return matchSearch && matchPeran;
    });
  }, [users, search, filterPeran]);

  const countByPeran = useMemo(() => {
    return {
      semua: users.length,
      admin: users.filter((u) => u.peran === "admin").length,
      petugas: users.filter((u) => u.peran === "petugas").length,
      peminjam: users.filter((u) => u.peran === "peminjam").length,
    };
  }, [users]);

  const handleRoleChange = async (
    userId: string,
    newRole: PeranPengguna,
    nama: string
  ) => {
    setUpdatingId(userId);
    await updateUserRole(userId, newRole, nama);
    await loadData();
    setUpdatingId(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    const formData = new FormData();
    formData.append("nama_lengkap", namaLengkap);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("peran", peran);
    const res = await createUserAction(formData);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsAddOpen(false);
      setNamaLengkap("");
      setEmail("");
      setPassword("");
      setPeran("peminjam");
      loadData();
    }
    setIsSaving(false);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");
    const res = await deleteUser(deleteTarget.id, deleteTarget.nama);
    if (res?.error) {
      setDeleteError(res.error);
    } else {
      setDeleteTarget(null);
      loadData();
    }
    setIsDeleting(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwModal) return;
    setPwSaving(true);
    setPwError("");
    const res = await updateUserPassword(pwModal.id, newPassword, pwModal.nama);
    if (res.error) {
      setPwError(res.error);
    } else {
      setPwModal(null);
      setNewPassword("");
    }
    setPwSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Manajemen Pengguna
          </h1>
        </div>
        <Button
          className="bg-primary shadow-md hover:shadow-lg transition-all"
          onClick={() => {
            setNamaLengkap("");
            setEmail("");
            setPassword("");
            setPeran("peminjam");
            setErrorMsg("");
            setIsAddOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <Card className="shadow-sm border-border/50 !gap-0 !py-0">
        <CardHeader className="!py-3 !px-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <select
              value={filterPeran}
              onChange={(e) => setFilterPeran(e.target.value as FilterPeran)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              <option value="semua">Semua Peran</option>
              <option value="admin">Administrator</option>
              <option value="petugas">Petugas</option>
              <option value="peminjam">Peminjam</option>
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari nama pengguna..."
                className="pl-8 bg-background h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Memuat data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-4">Nama Lengkap</TableHead>
                  <TableHead className="px-4 w-[140px]">Peran</TableHead>
                  <TableHead className="px-4 w-[130px]">Terdaftar</TableHead>
                  <TableHead className="px-4 w-[160px]">Terakhir Diubah</TableHead>
                  <TableHead className="px-4 text-right w-[210px]">Peran &amp; Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const peranInfo = getPeranLabel(user.peran);
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/20">
                        <TableCell className="px-4 font-medium">
                          {user.nama_lengkap}
                        </TableCell>
                        <TableCell className="px-4">
                          <Badge
                            variant="outline"
                            className={peranInfo.className}
                          >
                            {peranInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground text-sm">
                          {user.created_at || user.dibuat_pada
                            ? new Date(
                                user.created_at || user.dibuat_pada
                              ).toLocaleDateString("id-ID")
                            : "-"}
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground text-sm">
                          {user.terakhir_diubah
                            ? new Date(user.terakhir_diubah).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="px-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {updatingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <select
                                className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                                value={user.peran}
                                onChange={(e) =>
                                  handleRoleChange(
                                    user.id,
                                    e.target.value as PeranPengguna,
                                    user.nama_lengkap
                                  )
                                }
                              >
                                <option value="peminjam">Peminjam</option>
                                <option value="petugas">Petugas</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                            {/* Reset Password */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Reset Password"
                              onClick={() => {
                                setPwModal({ id: user.id, nama: user.nama_lengkap });
                                setNewPassword("");
                                setPwError("");
                              }}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            {/* Hapus */}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Hapus Pengguna"
                              onClick={() => {
                                setDeleteError("");
                                setDeleteTarget({ id: user.id, nama: user.nama_lengkap });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Tidak ada pengguna ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Modal: Tambah Pengguna ── */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAddOpen(false)}
        >
          <Card
            className="w-full max-w-md shadow-2xl border-primary/20 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Tambah Pengguna</CardTitle>
            </CardHeader>
            <form onSubmit={handleAddUser}>
              <CardContent className="space-y-3 pb-4">
                {errorMsg && (
                  <div className="p-2.5 bg-destructive/10 text-destructive rounded-md text-sm">
                    {errorMsg}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Nama Lengkap</Label>
                  <Input
                    placeholder="Contoh: Ahmad Subagyo"
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="ahmad@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Peran</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={peran}
                    onChange={(e) => setPeran(e.target.value as PeranPengguna)}
                  >
                    <option value="peminjam">Peminjam</option>
                    <option value="petugas">Petugas</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Simpan
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* ── Modal: Reset Password ── */}
      {pwModal && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPwModal(null)}
        >
          <Card
            className="w-full max-w-sm shadow-2xl border-primary/20"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Reset Password</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pwModal.nama}
              </p>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-3 pb-4">
                {pwError && (
                  <div className="p-2.5 bg-destructive/10 text-destructive rounded-md text-sm">
                    {pwError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Password Baru</Label>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPwModal(null)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={pwSaving}>
                  {pwSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Simpan Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
      {/* ── Modal: Konfirmasi Hapus Pengguna ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <Card
            className="w-full max-w-sm shadow-2xl border-destructive/20 !gap-0 !py-0"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="!py-3 !px-4 pb-2">
              <CardTitle className="text-lg">Hapus Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {deleteError && (
                <div className="p-2.5 bg-destructive/10 text-destructive rounded-md text-sm">
                  {deleteError}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus pengguna{" "}
                <strong className="text-foreground">{deleteTarget.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={handleConfirmDeleteUser}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Hapus
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
