import {
  formatRupiah,
  getKondisiBadgeInfo,
  getStatusBadgeInfo,
  getStatusPembayaranBadgeInfo,
} from "@/lib/status-mapper";

/**
 * Generator PDF A4 murni (tanpa dependensi eksternal) untuk mengekspor
 * Laporan Peminjaman, Pengembalian & Denda langsung menjadi file .pdf.
 */

function escapePdfText(text: string): string {
  return text
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncateText(text: string, maxLen: number): string {
  const clean = (text || "-").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, Math.max(0, maxLen - 2)) + "..";
}

interface ReportPdfParams {
  reportData: any;
  startDate?: string;
  endDate?: string;
}

export function downloadTransactionReportPdf({
  reportData,
  startDate,
  endDate,
}: ReportPdfParams) {
  const PAGE_W = 595.28; // A4 portrait width (pt)
  const PAGE_H = 841.89; // A4 portrait height (pt)
  const MARGIN = 36;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const pages: string[][] = [];
  let cmds: string[] = [];
  let y = PAGE_H - MARGIN;

  const newPage = () => {
    if (cmds.length > 0) pages.push(cmds);
    cmds = [];
    y = PAGE_H - MARGIN;
  };

  const addText = (
    text: string,
    x: number,
    yPos: number,
    size = 9,
    bold = false,
    color = "0.1 0.1 0.1"
  ) => {
    const font = bold ? "F2" : "F1";
    cmds.push(`BT /${font} ${size} Tf ${color} rg ${x.toFixed(2)} ${yPos.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`);
  };

  const addRightText = (
    text: string,
    rightX: number,
    yPos: number,
    size = 9,
    bold = false,
    color = "0.1 0.1 0.1"
  ) => {
    const avgCharW = size * (bold ? 0.54 : 0.49);
    const estW = text.length * avgCharW;
    addText(text, Math.max(MARGIN, rightX - estW), yPos, size, bold, color);
  };

  const addLine = (x1: number, y1: number, x2: number, y2: number, width = 0.5, color = "0.82 0.84 0.88") => {
    cmds.push(`${width} w ${color} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };

  const addRect = (x: number, bottomY: number, w: number, h: number, fillColor: string, strokeColor?: string) => {
    if (strokeColor) {
      cmds.push(`${fillColor} rg ${strokeColor} RG 0.6 w ${x.toFixed(2)} ${bottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`);
    } else {
      cmds.push(`${fillColor} rg ${x.toFixed(2)} ${bottomY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    }
  };

  // ── Header Dokumen ──
  addText("LAPORAN PEMINJAMAN, PENGEMBALIAN & DENDA ALAT", MARGIN, y, 13, true, "0.06 0.09 0.16");
  y -= 16;

  const periodStart = startDate ? new Date(startDate).toLocaleDateString("id-ID") : "Awal";
  const periodEnd = endDate ? new Date(endDate).toLocaleDateString("id-ID") : "Hari Ini";
  const printedAt = new Date().toLocaleString("id-ID");

  addText(`Periode: ${periodStart} s/d ${periodEnd}`, MARGIN, y, 9, false, "0.35 0.4 0.48");
  addRightText(`Dicetak: ${printedAt}`, PAGE_W - MARGIN, y, 8, false, "0.45 0.5 0.56");
  y -= 10;
  addLine(MARGIN, y, PAGE_W - MARGIN, y, 1, "0.2 0.45 0.85");
  y -= 18;

  // ── Ringkasan Statistik ──
  const boxH = 44;
  const gap = 8;
  const boxW = (CONTENT_W - gap * 3) / 4;
  const summaryCards = [
    { label: "Total Peminjaman", value: String(reportData?.totalLoans || 0) },
    { label: "Pengembalian Selesai", value: String(reportData?.totalReturns || 0) },
    { label: "Denda Lunas", value: formatRupiah(reportData?.totalDendaLunas || 0) },
    { label: "Denda Tertunggak", value: formatRupiah(reportData?.totalDendaTertunggak || 0) },
  ];

  summaryCards.forEach((card, idx) => {
    const bx = MARGIN + idx * (boxW + gap);
    addRect(bx, y - boxH, boxW, boxH, "0.96 0.97 0.99", "0.85 0.88 0.92");
    addText(card.label, bx + 8, y - 15, 7.5, false, "0.4 0.45 0.52");
    addText(card.value, bx + 8, y - 33, 10, true, "0.08 0.12 0.2");
  });

  y -= boxH + 18;

  // ── Judul Tabel ──
  addText("Rekapitulasi Peminjaman, Pengembalian & Denda", MARGIN, y, 10.5, true, "0.1 0.14 0.22");
  y -= 12;

  // Definisi kolom (total = CONTENT_W = 523.28)
  const cols = [
    { label: "No", x: MARGIN, w: 22, align: "left" as const },
    { label: "Peminjam", x: MARGIN + 22, w: 86, align: "left" as const },
    { label: "Alat", x: MARGIN + 108, w: 102, align: "left" as const },
    { label: "Tgl Ajukan", x: MARGIN + 210, w: 58, align: "left" as const },
    { label: "Status", x: MARGIN + 268, w: 66, align: "left" as const },
    { label: "Kondisi", x: MARGIN + 334, w: 64, align: "left" as const },
    { label: "Total Denda", x: MARGIN + 398, w: 62, align: "right" as const },
    { label: "Bayar", x: MARGIN + 460, w: 63.28, align: "right" as const },
  ];

  const drawTableHeader = () => {
    const headerH = 22;
    addRect(MARGIN, y - headerH, CONTENT_W, headerH, "0.93 0.95 0.98", "0.82 0.85 0.9");
    cols.forEach((c) => {
      if (c.align === "right") {
        addRightText(c.label, c.x + c.w - 4, y - 14, 8, true, "0.2 0.25 0.33");
      } else {
        addText(c.label, c.x + 4, y - 14, 8, true, "0.2 0.25 0.33");
      }
    });
    y -= headerH;
  };

  drawTableHeader();

  const rows = reportData?.loans || [];
  const rowH = 20;

  if (rows.length === 0) {
    addRect(MARGIN, y - 28, CONTENT_W, 28, "1 1 1", "0.88 0.9 0.93");
    addText("Tidak ada data transaksi pada periode ini.", MARGIN + 10, y - 17, 8.5, false, "0.45 0.5 0.55");
    y -= 28;
  } else {
    rows.forEach((loan: any, idx: number) => {
      if (y - rowH < MARGIN + 24) {
        newPage();
        drawTableHeader();
      }

      const bg = idx % 2 === 1 ? "0.985 0.99 0.995" : "1 1 1";
      addRect(MARGIN, y - rowH, CONTENT_W, rowH, bg, "0.9 0.92 0.94");

      const retRaw = loan.pengembalian;
      const ret = Array.isArray(retRaw) ? retRaw[0] : retRaw;

      const peminjam = truncateText(loan.peminjam?.nama_lengkap || "-", 16);
      const alat = truncateText(`${loan.alat?.nama || "-"} (${loan.jumlah || 1})`, 19);
      const tgl = loan.diajukan_pada
        ? new Date(loan.diajukan_pada).toLocaleDateString("id-ID")
        : "-";
      const status = truncateText(getStatusBadgeInfo(loan.status).label, 12);
      const kondisi = ret
        ? truncateText(getKondisiBadgeInfo(ret.kondisi_setelah || "baik").label, 12)
        : "-";
      const totalDenda = ret ? formatRupiah(ret.jumlah_denda || 0) : "-";
      const bayar = ret
        ? truncateText(getStatusPembayaranBadgeInfo(ret.status_pembayaran || "lunas").label, 11)
        : "-";

      const textY = y - 13;
      addText(String(idx + 1), cols[0].x + 4, textY, 8);
      addText(peminjam, cols[1].x + 4, textY, 8);
      addText(alat, cols[2].x + 4, textY, 8);
      addText(tgl, cols[3].x + 4, textY, 8);
      addText(status, cols[4].x + 4, textY, 8);
      addText(kondisi, cols[5].x + 4, textY, 8);
      addRightText(totalDenda, cols[6].x + cols[6].w - 4, textY, 7.5);
      addRightText(bayar, cols[7].x + cols[7].w - 4, textY, 7.5);

      y -= rowH;
    });
  }

  if (cmds.length > 0) pages.push(cmds);

  // ── Susun Struktur Binary PDF 1.4 ──
  // Objek:
  // 1: Catalog
  // 2: Pages
  // 3: Font Helvetica
  // 4: Font Helvetica-Bold
  // 5.. : pasangan (Page object, Content stream object) per halaman
  const objects: string[] = [];
  const pageObjNums: number[] = [];

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push(""); // placeholder untuk 2 0 obj (Pages)
  objects.push("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
  objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

  let nextObjNum = 5;
  pages.forEach((pageCmds) => {
    const pageNum = nextObjNum++;
    const streamNum = nextObjNum++;
    pageObjNums.push(pageNum);

    const streamBody = pageCmds.join("\n");
    objects.push(
      `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamNum} 0 R >>\nendobj\n`
    );
    objects.push(
      `${streamNum} 0 obj\n<< /Length ${streamBody.length} >>\nstream\n${streamBody}\nendstream\nendobj\n`
    );
  });

  objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageObjNums.length} >>\nendobj\n`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateSuffix = new Date().toISOString().split("T")[0];
  a.download = `laporan-transaksi-${dateSuffix}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
