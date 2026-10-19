"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getUsers, updateUserRole, createUserAction, deleteUser } from "@/actions/users";
import { getPeranLabel } from "@/lib/status-mapper";
import { PeranPengguna } from "@/types/database.types";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal Tambah Pengguna state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [peran, setPeran] = useState<PeranPengguna>("peminjam");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.nama_lengkap?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: PeranPengguna) => {
    setUpdatingId(userId);
    await updateUserRole(userId, newRole);
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
      setIsModalOpen(false);
      setNamaLengkap("");
      setEmail("");
      setPassword("");
      setPeran("peminjam");
      loadData();
    }
    setIsSaving(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      await deleteUser(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-1">Kelola data admin, petugas, dan peminjam dari Supabase.</p>
        </div>
        <Button 
          className="bg-primary shadow-md hover:shadow-lg transition-all"
          onClick={() => {
            setNamaLengkap("");
            setEmail("");
            setPassword("");
            setPeran("peminjam");
            setErrorMsg("");
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Daftar Pengguna</CardTitle>
              <CardDescription>Total {users.length} pengguna terdaftar</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari nama pengguna..."
                className="pl-8 bg-background"
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
              <p className="text-sm text-muted-foreground">Memuat data pengguna dari Supabase...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Role / Peran</TableHead>
                  <TableHead>Tanggal Registrasi</TableHead>
                  <TableHead className="text-right">Ubah Peran / Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const peranInfo = getPeranLabel(user.peran);
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">{user.nama_lengkap}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={peranInfo.className}>
                            {peranInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.created_at || user.dibuat_pada ? new Date(user.created_at || user.dibuat_pada).toLocaleDateString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            {updatingId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin inline text-primary" />
                            ) : (
                              <select
                                className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                                value={user.peran}
                                onChange={(e) => handleRoleChange(user.id, e.target.value as PeranPengguna)}
                              >
                                <option value="peminjam">Peminjam</option>
                                <option value="petugas">Petugas</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(user.id)}
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
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Tidak ada data pengguna ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Tambah Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">Tambah Pengguna Baru</CardTitle>
            </CardHeader>
            <form onSubmit={handleAddUser}>
              <CardContent className="space-y-4">
                {errorMsg && <div className="p-3 bg-red-500/10 text-red-600 rounded-md text-sm">{errorMsg}</div>}
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input 
                    placeholder="Contoh: Ahmad Subagyo"
                    value={namaLengkap} 
                    onChange={(e) => setNamaLengkap(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email (Opsional)</Label>
                  <Input 
                    type="email"
                    placeholder="ahmad@aluna.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password (Opsional)</Label>
                  <Input 
                    type="password"
                    placeholder="Default: password123"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role / Peran</Label>
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
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Simpan Pengguna"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
