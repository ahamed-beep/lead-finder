import type { LeadRow } from "@/types/lead";

type RGB = [number, number, number];

const BLUE: RGB = [37, 99, 235];
const BLUE_50: RGB = [239, 246, 255];
const AMBER: RGB = [217, 119, 6];
const G900: RGB = [17, 24, 39];
const G600: RGB = [75, 85, 99];
const G500: RGB = [107, 114, 128];
const G200: RGB = [229, 231, 235];
const G50: RGB = [249, 250, 251];

export function getLeadStats(leads: LeadRow[]) {
  const total = leads.length;
  const websiteLeads = leads.filter((l) => l.leadType === "Website").length;
  return {
    total,
    websiteLeads,
    reputationLeads: total - websiteLeads,
    noWebsite: leads.filter((l) => l.website === "No website").length,
    withPhone: leads.filter((l) => l.phone && l.phone !== "-").length,
    totalReviews: leads.reduce((sum, l) => sum + l.reviews, 0),
    avgRating: total
      ? (leads.reduce((sum, l) => sum + parseFloat(l.rating), 0) / total).toFixed(1)
      : "0.0",
  };
}

interface ReportOptions {
  city?: string;
  filtersSummary?: string;
  /** Real data ke liye sample: false bhejo */
  sample?: boolean;
}

export async function downloadLeadReport(leads: LeadRow[], opts: ReportOptions = {}) {
  if (leads.length === 0) return;
  const { city = "Dubai", filtersSummary, sample = true } = opts;

  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const CW = W - M * 2;
  const s = getLeadStats(leads);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const ink = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

  /* ---------- header ---------- */
  fill(BLUE);
  doc.roundedRect(M, 40, 30, 30, 8, 8, "F");
  stroke([255, 255, 255]);
  doc.setLineWidth(1.5);
  doc.circle(M + 15, 55, 8, "S");
  fill([255, 255, 255]);
  doc.circle(M + 15, 55, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  ink(G900);
  doc.text("Lead Finder", M + 40, 60);

  doc.setFontSize(7.5);
  ink(G500);
  doc.text(`BUSINESS DEVELOPMENT / ${city.toUpperCase()}`, W - M, 59, { align: "right" });

  /* ---------- title block ---------- */
  let y = 100;
  if (sample) {
    fill(BLUE_50);
    doc.roundedRect(M, y, 92, 22, 5, 5, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    ink(BLUE);
    doc.text("SAMPLE REPORT", M + 10, y + 14.5);
    y += 22 + 38;
  } else {
    y += 34;
  }

  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  ink(G900);
  doc.text("Lead Report", M, y);

  y += 26;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  ink(G500);
  doc.text(`Leads - ${city}`, M, y);
  doc.text(today, W - M, y, { align: "right" });

  y += 14;
  fill(BLUE);
  doc.rect(M, y, CW, 2.5, "F");

  /* ---------- search summary ---------- */
  y += 36;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  ink(G900);
  doc.text("Search summary", M, y);

  y += 20;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  ink(G600);
  const phoneText = s.withPhone === s.total ? `All ${s.total}` : `${s.withPhone} of ${s.total}`;
  const summary =
    `${s.total} leads across ${city}: ${s.websiteLeads} website opportunities and ` +
    `${s.reputationLeads} reputation opportunities. ${phoneText} have a phone number available.`;
  const lines = doc.splitTextToSize(summary, CW);
  doc.text(lines, M, y);
  y += lines.length * 13 + 8;

  /* ---------- stat cards ---------- */
  const stats = [
    ["Total leads", String(s.total)],
    ["No website", String(s.noWebsite)],
    ["Avg. rating", s.avgRating],
    ["Phone available", `${s.withPhone} / ${s.total}`],
  ];
  const gap = 10;
  const cardW = (CW - gap * 3) / 4;
  const cardH = 58;
  stats.forEach(([label, value], i) => {
    const x = M + i * (cardW + gap);
    fill(G50);
    stroke(G200);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, cardW, cardH, 8, 8, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    ink(G500);
    doc.text(label, x + 12, y + 18);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    ink(G900);
    doc.text(value, x + 12, y + 42);
  });
  y += cardH + 16;

  if (filtersSummary) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    ink(G500);
    doc.text(filtersSummary, M, y);
    y += 14;
  }

  /* ---------- lead directory ---------- */
  y += 22;
  if (y > H - 200) {
    doc.addPage();
    y = 50;
  }
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  ink(G900);
  doc.text("Lead directory", M, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  ink(G500);
  doc.text("Sorted by rating (high to low)", W - M, y, { align: "right" });

  const sorted = [...leads].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

  autoTable(doc, {
    startY: y + 12,
    margin: { left: M, right: M, bottom: 60 },
    theme: "plain",
    head: [["Business", "Area", "Rating", "Reviews", "Phone", "Email", "Opportunity", "Website"]],
    body: sorted.map((l) => [
      l.name,
      l.area,
      l.rating,
      String(l.reviews),
      l.phone,
      l.email || "-",
      l.leadType,
      l.website,
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: G600,
      cellPadding: { top: 8, bottom: 8, left: 5, right: 5 },
      overflow: "linebreak",
    },
    headStyles: { fillColor: G50, textColor: G500, fontStyle: "normal", fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 95, fontStyle: "bold", textColor: G900 },
      1: { cellWidth: 55 },
      2: { cellWidth: 34, fontStyle: "bold", textColor: G900 },
      3: { cellWidth: 38 },
      4: { cellWidth: 70 },
      5: { cellWidth: 103 },
      6: { cellWidth: 58 },
      7: { cellWidth: 62 },
    },
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 6) {
        d.cell.styles.textColor = d.cell.raw === "Website" ? BLUE : AMBER;
        d.cell.styles.fontStyle = "bold";
      }
    },
    didDrawCell: (d) => {
      if (d.section === "body") {
        stroke(G200);
        doc.setLineWidth(0.5);
        doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height);
      }
    },
  });

  /* ---------- disclaimer (sirf sample report mein) ---------- */
  if (sample) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    let dy = finalY + 28;
    if (dy + 80 > H - 60) {
      doc.addPage();
      dy = 50;
    }
    fill(G50);
    stroke(G200);
    doc.setLineWidth(0.8);
    doc.roundedRect(M, dy, CW, 66, 8, 8, "FD");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    ink(G900);
    doc.text("Illustrative sample data", M + 16, dy + 22);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    ink(G500);
    doc.text(
      doc.splitTextToSize(
        "All clinic, contact details and review themes are fictional. This report is a product demonstration and is not intended for real-world outreach.",
        CW - 32
      ),
      M + 16,
      dy + 38
    );
  }

  /* ---------- footer on every page ---------- */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    stroke(G200);
    doc.setLineWidth(0.5);
    doc.line(M, H - 44, W - M, H - 44);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    ink(G500);
    doc.text("Data from: Google Places API", M, H - 28);
    doc.text(`Lead Finder - ${today}`, W / 2, H - 28, { align: "center" });
    doc.text(`Page ${i} of ${pages}`, W - M, H - 28, { align: "right" });
  }

  doc.save(`lead-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}