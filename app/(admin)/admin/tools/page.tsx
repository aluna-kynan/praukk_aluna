"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { getTools, createTool, deleteTool, updateTool } from "@/actions/tools";
import { getCategories } from "@/actions/categories";
import { getKondisiBadgeInfo } from "@/lib/status-mapper";
import { KondisiAlat } from "@/types/database.types";

export default function AdminToolsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editToolId, setEditToolId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [kategoriId, setKategoriId] = useState("");
  const [stokTotal, setStokTotal] = useState(1);
  const [stokTersedia, setStokTersedia] = useState(1);
  const [kondisi, setKondisi] = useState<KondisiAlat>("baik");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [toolsData, catData] = await Promise.all([getTools(), getCategories()]);
    setTools(toolsData || []);
    setCategories(catData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTools = tools.filter((t) =>
    t.nama?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditToolId(null);
    setNama("");
    setKategoriId(categories[0]?.id || "");
    setStokTotal(1);
    setStokTersedia(1);
    setKondisi("baik");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (tool: any) => {
    setEditToolId(tool.id);
    setNama(tool.nama);
    setKategoriId(tool.kategori_id);
    setStokTotal(tool.stok_total);
    setStokTersedia(tool.stok_tersedia);
    setKondisi(tool.kondisi);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("kategori_id", kategoriId);
    formData.append("stok_total", stokTotal.toString());
    formData.append("stok_tersedia", stokTersedia.toString());
    formData.append("kondisi", kondisi);

    let res;
    if (editToolId) {
      res = await updateTool(editToolId, formData);
    } else {
      res = await createTool(formData);
    }

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      setIsModalOpen(false);
      loadData();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus alat ini?")) {
      await deleteTool(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Alat</h1>
          <p className="text-muted-foreground mt-1">Tambah, perbarui stok, dan atur daftar alat inventaris.</p>
        </div>
        <Button className="bg-primary shadow-md hover:shadow-lg transition-all" onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Alat Baru
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Daftar Inventaris Alat</CardTitle>
              <CardDescription>Total {tools.length} macam alat terdaftar di database</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari alat..."
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
              <p className="text-sm text-muted-foreground">Memuat data alat dari Supabase...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Nama Alat</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Stok Total</TableHead>
                  <TableHead>Tersedia</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTools.length > 0 ? (
                  filteredTools.map((tool) => {
                    const kondisiInfo = getKondisiBadgeInfo(tool.kondisi);
                    return (
                      <TableRow key={tool.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">{tool.nama}</TableCell>
                        <TableCell className="text-muted-foreground">{tool.kategori?.nama || "-"}</TableCell>
                        <TableCell>{tool.stok_total}</TableCell>
                        <TableCell className="font-semibold text-primary">{tool.stok_tersedia}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={kondisiInfo.className}>
                            {kondisiInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditModal(tool)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(tool.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Belum ada data alat terdaftar.
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
            <CardHeader>
              <CardTitle className="text-xl">{editToolId ? "Edit Alat" : "Tambah Alat Baru"}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4">
                {errorMsg && <div className="p-3 bg-red-500/10 text-red-600 rounded-md text-sm">{errorMsg}</div>}
                <div className="space-y-2">
                  <Label>Nama Alat</Label>
                  <Input value={nama} onChange={(e) => setNama(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={kategoriId}
                    onChange={(e) => setKategoriId(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stok Total</Label>
                    <Input type="number" min="0" value={stokTotal} onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setStokTotal(val);
                      if (!editToolId) setStokTersedia(val);
                    }} required />
                  </div>
                  {editToolId && (
                    <div className="space-y-2">
                      <Label>Stok Tersedia</Label>
                      <Input type="number" min="0" max={stokTotal} value={stokTersedia} onChange={(e) => setStokTersedia(parseInt(e.target.value) || 0)} required />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Kondisi</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={kondisi}
                    onChange={(e) => setKondisi(e.target.value as KondisiAlat)}
                  >
                    <option value="baik">Baik</option>
                    <option value="rusak_ringan">Rusak Ringan</option>
                    <option value="rusak_berat">Rusak Berat</option>
                  </select>
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
    </div>
  );
}
