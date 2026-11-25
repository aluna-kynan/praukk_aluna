"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, Upload, ImageIcon } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getTools, createTool, deleteTool, updateTool } from "@/actions/tools";
import { getCategories } from "@/actions/categories";
import { getKondisiBadgeInfo } from "@/lib/status-mapper";
import { KondisiAlat } from "@/types/database.types";

/**
 * Mengonversi file gambar apa pun (PNG, JPG, GIF, WebP, dll.) menjadi file .webp
 * menggunakan HTML5 Canvas sebelum diunggah ke server.
 */
async function convertImageToWebp(file: File, maxDim = 1200, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Canvas tidak didukung di browser ini."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error("Gagal mengonversi gambar ke WebP."));
              return;
            }
            const baseName = file.name.replace(/\.[^/.]+$/, "") || "gambar";
            const webpFile = new File([blob], `${baseName}.webp`, { type: "image/webp" });
            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("File bukan gambar yang valid."));
    };

    img.src = objectUrl;
  });
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("all");
  const [filterKondisi, setFilterKondisi] = useState("all");

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editToolId, setEditToolId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [kategoriId, setKategoriId] = useState("");
  const [stokTotal, setStokTotal] = useState(1);
  const [stokTersedia, setStokTersedia] = useState(1);
  const [kondisi, setKondisi] = useState<KondisiAlat>("baik");

  // Image upload state
  const [webpFile, setWebpFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeGambar, setRemoveGambar] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const resetImageState = (existingUrl: string | null = null) => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setWebpFile(null);
    setPreviewUrl(existingUrl);
    setRemoveGambar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeModal = () => {
    resetImageState(null);
    setIsModalOpen(false);
  };

  const filteredTools = tools.filter((t) => {
    const matchSearch = t.nama?.toLowerCase().includes(search.toLowerCase());
    const matchKat = filterKategori === "all" || t.kategori_id === filterKategori;
    const matchKon = filterKondisi === "all" || t.kondisi === filterKondisi;
    return matchSearch && matchKat && matchKon;
  });

  const openAddModal = () => {
    setEditToolId(null);
    setNama("");
    setKategoriId(categories[0]?.id || "");
    setStokTotal(1);
    setStokTersedia(1);
    setKondisi("baik");
    resetImageState(null);
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
    resetImageState(tool.gambar_url || null);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Pilih file gambar yang valid (JPG, PNG, WebP, dll).");
      return;
    }

    setErrorMsg("");
    setIsConverting(true);
    try {
      const converted = await convertImageToWebp(file);
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setWebpFile(converted);
      setPreviewUrl(URL.createObjectURL(converted));
      setRemoveGambar(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal mengonversi gambar ke WebP.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setWebpFile(null);
    setPreviewUrl(null);
    setRemoveGambar(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

    if (webpFile) {
      formData.append("gambar", webpFile);
    }
    if (removeGambar) {
      formData.append("remove_gambar", "true");
    }

    let res;
    if (editToolId) {
      res = await updateTool(editToolId, formData);
    } else {
      res = await createTool(formData);
    }

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      closeModal();
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
        </div>
        <Button className="bg-primary shadow-md hover:shadow-lg transition-all" onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Alat
        </Button>
      </div>

      <Card className="shadow-sm border-border/50 !gap-0 !py-0">
        <CardHeader className="!py-3 !px-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nama}</option>
                ))}
              </select>
              <select
                value={filterKondisi}
                onChange={(e) => setFilterKondisi(e.target.value)}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium cursor-pointer"
              >
                <option value="all">Semua Kondisi</option>
                <option value="baik">Baik</option>
                <option value="rusak_ringan">Rusak Ringan</option>
                <option value="rusak_berat">Rusak Berat</option>
              </select>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari alat..."
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
                  <TableHead className="px-4">Nama Alat</TableHead>
                  <TableHead className="px-4 w-[150px]">Kategori</TableHead>
                  <TableHead className="px-4 text-center w-[110px]">Stok Total</TableHead>
                  <TableHead className="px-4 text-center w-[110px]">Tersedia</TableHead>
                  <TableHead className="px-4 w-[140px]">Kondisi</TableHead>
                  <TableHead className="px-4 text-right w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTools.length > 0 ? (
                  filteredTools.map((tool) => {
                    const kondisiInfo = getKondisiBadgeInfo(tool.kondisi);
                    return (
                      <TableRow key={tool.id} className="hover:bg-muted/20">
                        <TableCell className="px-4 font-medium">
                          <div className="flex items-center gap-3">
                            {tool.gambar_url ? (
                              <img
                                src={tool.gambar_url}
                                alt={tool.nama}
                                className="h-9 w-9 rounded-lg object-cover border border-border/60 shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                            )}
                            <span>{tool.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground">{tool.kategori?.nama || "-"}</TableCell>
                        <TableCell className="px-4 text-center">{tool.stok_total}</TableCell>
                        <TableCell className="px-4 text-center font-semibold text-primary">{tool.stok_tersedia}</TableCell>
                        <TableCell className="px-4">
                          <Badge variant="outline" className={kondisiInfo.className}>
                            {kondisiInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 text-right">
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
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <Card
            className="w-full max-w-md shadow-2xl border-primary/20 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{editToolId ? "Edit Alat" : "Tambah Alat Baru"}</CardTitle>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-3 pb-4">
                {errorMsg && <div className="p-2.5 bg-red-500/10 text-red-600 rounded-md text-sm">{errorMsg}</div>}

                {/* Upload Gambar */}
                <div className="space-y-1.5">
                  <Label>Gambar Alat</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20">
                      <img
                        src={previewUrl}
                        alt="Pratinjau alat"
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2.5 text-xs shadow-sm"
                          disabled={isConverting}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Ganti
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="h-7 w-7 shadow-sm"
                          disabled={isConverting}
                          onClick={handleRemoveImage}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isConverting}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer"
                    >
                      {isConverting ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-primary" />
                          <span className="text-xs font-medium text-foreground">Pilih Gambar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

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
                    <Input
                      type="number"
                      min="0"
                      value={stokTotal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setStokTotal(val);
                        if (!editToolId) setStokTersedia(val);
                      }}
                      required
                    />
                  </div>
                  {editToolId && (
                    <div className="space-y-2">
                      <Label>Stok Tersedia</Label>
                      <Input
                        type="number"
                        min="0"
                        max={stokTotal}
                        value={stokTersedia}
                        onChange={(e) => setStokTersedia(parseInt(e.target.value) || 0)}
                        required
                      />
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
                <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
                <Button type="submit" disabled={isSaving || isConverting}>
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
