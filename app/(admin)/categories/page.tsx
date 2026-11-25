"use client";

import { useState, useEffect } from "react";
import { Plus, FolderTree, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/actions/categories";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadData = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setNama("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditId(cat.id);
    setNama(cat.nama);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("nama", nama);

    let res;
    if (editId) {
      res = await updateCategory(editId, formData);
    } else {
      res = await createCategory(formData);
    }

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      setIsModalOpen(false);
      loadData();
    }
    setIsSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");
    const res = await deleteCategory(deleteTarget.id);
    if (res?.error) {
      setDeleteError(res.error);
    } else {
      setDeleteTarget(null);
      loadData();
    }
    setIsDeleting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Kategori Alat</h1>
        </div>
        <Button className="bg-primary shadow-md hover:shadow-lg transition-all" onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <Card className="shadow-sm border-border/50 !gap-0 !py-0">
        <CardHeader className="!py-3 !px-4 border-b bg-muted/20">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" /> Daftar Kategori
          </CardTitle>
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
                  <TableHead className="px-4">Nama Kategori</TableHead>
                  <TableHead className="px-4 text-right w-[110px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <TableRow key={cat.id} className="hover:bg-muted/20">
                      <TableCell className="px-4 font-medium">{cat.nama}</TableCell>
                      <TableCell className="px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditModal(cat)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              setDeleteError("");
                              setDeleteTarget({ id: cat.id, nama: cat.nama });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-32 text-center text-muted-foreground">
                      Belum ada data kategori.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{editId ? "Edit Kategori" : "Tambah Kategori Baru"}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-3 pb-4">
                {errorMsg && <div className="p-2.5 bg-red-500/10 text-red-600 rounded-md text-sm">{errorMsg}</div>}
                <div className="space-y-1.5">
                  <Label>Nama Kategori</Label>
                  <Input value={nama} onChange={(e) => setNama(e.target.value)} required />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Simpan"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Kategori */}
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
              <CardTitle className="text-lg">Hapus Kategori</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {deleteError && (
                <div className="p-2.5 bg-destructive/10 text-destructive rounded-md text-sm">
                  {deleteError}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus kategori{" "}
                <strong className="text-foreground">{deleteTarget.nama}</strong>?
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
                onClick={handleConfirmDelete}
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
