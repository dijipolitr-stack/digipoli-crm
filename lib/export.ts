// lib/export.ts
// Excel (.xlsx) ve PDF dışa aktarma yardımcıları
// ─────────────────────────────────────────────
// Gerekli:  npm install xlsx jspdf jspdf-autotable
//           npm install --save-dev @types/jspdf

// ── Tür tanımları ─────────────────────────────────────────
export interface ExportCustomer {
  musteri_id: string; ad_soyad: string; kanal: string | null;
  tarih: string | null; saat: string | null; steki: string | null;
  durum: string; konusma_ozeti: string | null;
  atanan?: { name: string } | null;
}

export interface ExportPerformance {
  name: string; total: number; tamamlandi: number;
  takipte: number; bekliyor: number; conversionRate: number;
}

export interface ExportWebhookLog {
  created_at: string; status: string; musteri_id: string | null; error_msg: string | null;
}

// ─────────────────────────────────────────────────────────
// EXCEL
// ─────────────────────────────────────────────────────────
export async function exportCustomersExcel(customers: ExportCustomer[], filename = 'musteriler') {
  const XLSX = await import('xlsx');

  const rows = customers.map(c => ({
    'Müşteri ID':      c.musteri_id,
    'Ad Soyad':        c.ad_soyad,
    'Kanal':           c.kanal ?? '-',
    'Tarih':           c.tarih ?? '-',
    'Saat':            c.saat ?? '-',
    'Sigorta Türü':    c.steki ?? '-',
    'Durum':           c.durum,
    'Danışman':        c.atanan?.name ?? '-',
    'Konuşma Özeti':   c.konusma_ozeti ?? '-',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Kolon genişlikleri
  ws['!cols'] = [
    { wch: 18 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
    { wch: 8  }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 50 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Müşteriler');

  // Tarih sayfası ekle
  const infoWs = XLSX.utils.aoa_to_sheet([
    ['Rapor Tarihi', new Date().toLocaleDateString('tr-TR')],
    ['Toplam Kayıt', customers.length],
  ]);
  XLSX.utils.book_append_sheet(wb, infoWs, 'Bilgi');

  XLSX.writeFile(wb, `${filename}_${today()}.xlsx`);
}

export async function exportPerformanceExcel(data: ExportPerformance[], filename = 'performans') {
  const XLSX = await import('xlsx');

  const rows = data.map(d => ({
    'Danışman':        d.name,
    'Toplam Müşteri':  d.total,
    'Tamamlandı':      d.tamamlandi,
    'Takipte':         d.takipte,
    'Bekliyor':        d.bekliyor,
    'Dönüşüm Oranı':   `%${d.conversionRate}`,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Performans');
  XLSX.writeFile(wb, `${filename}_${today()}.xlsx`);
}

export async function exportWebhookLogsExcel(logs: ExportWebhookLog[], filename = 'webhook_loglar') {
  const XLSX = await import('xlsx');

  const rows = logs.map(l => ({
    'Tarih/Saat':    new Date(l.created_at).toLocaleString('tr-TR'),
    'Durum':         l.status,
    'Müşteri ID':    l.musteri_id ?? '-',
    'Hata Mesajı':   l.error_msg ?? '-',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Webhook Logları');
  XLSX.writeFile(wb, `${filename}_${today()}.xlsx`);
}

// ─────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────
export async function exportCustomersPDF(customers: ExportCustomer[], filename = 'musteriler') {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Başlık
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Digipoli CRM - Musteri Listesi', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130);
  doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}  |  Toplam: ${customers.length} kayit`, 14, 26);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 32,
    head: [['Musteri ID', 'Ad Soyad', 'Kanal', 'Tarih', 'Sigorta Turu', 'Durum', 'Danisман']],
    body: customers.map(c => [
      c.musteri_id,
      c.ad_soyad,
      c.kanal ?? '-',
      c.tarih ?? '-',
      c.steki ?? '-',
      c.durum,
      c.atanan?.name ?? '-',
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [79, 142, 247],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 255],
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 38 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 26 },
      5: { cellWidth: 28 },
      6: { cellWidth: 30 },
    },
  });

  // Sayfa numarası
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Sayfa ${i} / ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 8);
  }

  doc.save(`${filename}_${today()}.pdf`);
}

export async function exportPerformancePDF(data: ExportPerformance[], filename = 'performans') {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Digipoli CRM - Danisман Performansi', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130);
  doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 26);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 32,
    head: [['Danisман', 'Toplam', 'Tamamlandi', 'Takipte', 'Bekliyor', 'Donusum Orani']],
    body: data.map(d => [
      d.name,
      d.total,
      d.tamamlandi,
      d.takipte,
      d.bekliyor,
      `%${d.conversionRate}`,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [124, 92, 252], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 246, 255] },
  });

  doc.save(`${filename}_${today()}.pdf`);
}

// ── Yardımcı ──────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}
