"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, Info, PlusCircle, PackageSearch, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTools } from "@/actions/tools";
import { getCategories } from "@/actions/categories";
import { requestLoanAction } from "@/actions/loans";
import { getKondisiBadgeInfo } from "@/lib/status-mapper";

export default function ToolsCatalogPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Loan dialog state
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

  const filteredTools = tools.filter((t) => {
    const matchSearch = t.nama?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory ? t.kategori_id === selectedCategory : true;
    return matchSearch && matchCategory;
  });

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !dueDate) return;

    setIsSubmitting(true);
    setMessage(null);

    const res = await requestLoanAction(selectedTool.id, quantity, dueDate);

    if (res.error) {
      setMessage({ text: res.error, type: "error" });
    } else {
      setMessage({ text: "Pengajuan peminjaman berhasil dibuat!", type: "success" });
      setTimeout(() => {
        setSelectedTool(null);
        setMessage(null);
        loadData();
      }, 1500);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Katalog Alat</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Cari dan pinjam alat yang Anda butuhkan. Pastikan membaca deskripsi dan melihat stok yang tersedia sebelum mengajukan peminjaman.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari nama alat..."
            className="pl-9 h-10 bg-background/80 backdrop-blur-sm border-primary/20 focus-visible:ring-primary/50 rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
          onClick={() => setSelectedCategory(null)}
        >
          Semua Kategori
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className="cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-background hover:bg-muted transition-all"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.nama}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat katalog alat dari Supabase...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => {
              const kondisiInfo = getKondisiBadgeInfo(tool.kondisi);
              return (
                <Card key={tool.id} className="overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow group border-border/60">
                  <div className="relative h-44 w-full bg-muted overflow-hidden flex items-center justify-center">
                    <div className="text-muted-foreground font-semibold text-xl">
                      {tool.nama.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {tool.stok_tersedia > 0 ? (
                        <Badge className="bg-green-500/90 text-white shadow-sm border-0">
                          Tersedia: {tool.stok_tersedia}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="shadow-sm border-0">
                          Habis
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="pb-2 pt-4">
                    <div className="text-xs font-semibold text-primary/80 mb-1">
                      {tool.kategori?.nama || "Umum"}
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{tool.nama}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Kondisi: <Badge variant="outline" className={kondisiInfo.className}>{kondisiInfo.label}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 px-4">
                    <Button
                      className="w-full font-medium"
                      disabled={tool.stok_tersedia === 0}
                      onClick={() => {
                        setSelectedTool(tool);
                        setQuantity(1);
                        const fiveDaysLater = new Date();
                        fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
                        setDueDate(fiveDaysLater.toISOString().split("T")[0]);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {tool.stok_tersedia > 0 ? "Ajukan Peminjaman" : "Stok Kosong"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-lg font-medium">Alat tidak ditemukan</p>
              <p className="text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Pengajuan Peminjaman */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">Pinjam {selectedTool.nama}</CardTitle>
              <p className="text-xs text-muted-foreground">Stok Tersedia: {selectedTool.stok_tersedia}</p>
            </CardHeader>
            <form onSubmit={handleRequestLoan}>
              <CardContent className="space-y-4">
                {message && (
                  <div className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                    {message.text}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Jumlah Alat</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedTool.stok_tersedia}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Jatuh Tempo (Batas Pengembalian)</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground bg-amber-500/10 text-amber-700 dark:text-amber-400 p-2.5 rounded-md border border-amber-500/20">
                    ℹ️ Durasi peminjaman standar adalah <strong>5 hari</strong>. Pengembalian melebihi tanggal jatuh tempo dikenakan denda <strong>Rp 5.000 / hari</strong>.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedTool(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Kirim Pengajuan"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
