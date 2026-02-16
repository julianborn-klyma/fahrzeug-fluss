import { MaterialCatalogItem, InventoryStatus } from '@/types/database';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

interface MissingItem {
  name: string;
  article_number: string;
  category: string;
  item_type: 'Lager' | 'Bestellung';
  target: number;
  actual: number;
  missing: number;
}

export function getMissingItems(
  vehicleId: string,
  inventory: InventoryStatus[],
  catalog?: MaterialCatalogItem[],
  typeId?: string
): MissingItem[] {
  if (!catalog) return [];
  const vehicleInventory = inventory.filter(i => i.vehicle_id === vehicleId);
  const relevantCatalog = typeId ? catalog.filter(m => m.type_id === typeId) : catalog;
  const result: MissingItem[] = [];

  for (const mat of relevantCatalog) {
    const inv = vehicleInventory.find(i => i.material_id === mat.id);
    const actual = inv?.current_quantity ?? 0;
    const missing = mat.target_quantity - actual;
    if (missing > 0) {
      result.push({
        name: mat.name,
        article_number: mat.article_number,
        category: mat.category,
        item_type: mat.item_type,
        target: mat.target_quantity,
        actual,
        missing,
      });
    }
  }

  return result;
}

export function exportCSV(
  vehicleId: string,
  licensePlate: string,
  inventory: InventoryStatus[],
  itemType: 'Lager' | 'Bestellung',
  catalog?: MaterialCatalogItem[],
  typeId?: string
) {
  const items = getMissingItems(vehicleId, inventory, catalog, typeId).filter(
    i => i.item_type === itemType
  );

  const csvData = items.map(i => ({
    Artikelnummer: i.article_number,
    Menge: i.missing,
  }));

  const csv = Papa.unparse(csvData, { delimiter: ';', header: false });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${licensePlate}_${itemType}_fehlend.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Load logo as base64 for embedding in PDF — uses the app PWA icon
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch('/pwa-512x512.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// KLYMA brand color
const BRAND = { r: 0, g: 153, b: 204 }; // ~hsl(199, 89%, 40%)

export async function exportPDF(
  vehicleId: string,
  licensePlate: string,
  inventory: InventoryStatus[],
  itemType: 'Lager' | 'Bestellung' | 'all',
  catalog?: MaterialCatalogItem[],
  options?: { customerAddress?: string; assignedTo?: string; vehicleName?: string; typeId?: string }
) {
  const allMissing = getMissingItems(vehicleId, inventory, catalog, options?.typeId);
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginL = 14;
  const marginR = 14;
  const contentW = pageW - marginL - marginR;

  // Load logo
  const logoBase64 = await loadLogoBase64();

  const sections: Array<{ title: string; type: 'Lager' | 'Bestellung' }> =
    itemType === 'all'
      ? [{ title: 'Lager', type: 'Lager' }, { title: 'Bestellung', type: 'Bestellung' }]
      : [{ title: itemType, type: itemType }];

  let totalPages = 0;
  const pages: (() => void)[] = [];

  // --- Column layout ---
  const col = {
    no: marginL,
    item: marginL + 20,
    subcat: marginL + contentW * 0.55,
    missing: marginL + contentW * 0.80,
    artNr: marginL + contentW * 0.87,
  };
  const colWidths = {
    no: 20,
    item: contentW * 0.55 - 20,
    subcat: contentW * 0.80 - contentW * 0.55,
    missing: contentW * 0.87 - contentW * 0.80,
    artNr: contentW - contentW * 0.87,
  };

  const rowHeight = 7;
  const fontSize = 7;
  const headerHeight = 8;

  // Helper: draw table header
  const drawTableHeader = (y: number): number => {
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.rect(marginL, y, contentW, headerHeight, 'F');
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const hMid = y + headerHeight / 2 + 1.5;
    doc.text('No.', col.no + 2, hMid);
    doc.text('Item', col.item + 2, hMid);
    doc.text('Subcategory', col.subcat + 2, hMid);
    doc.text('Missing', col.missing + 2, hMid);
    doc.text('Art. Nr.', col.artNr + 2, hMid);
    doc.setTextColor(0, 0, 0);
    return y + headerHeight + 1;
  };

  // Helper: draw page footer
  const drawFooter = (pageNum: number, total: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const footerText = `Page ${pageNum} of ${total}`;
    const tw = doc.getTextWidth(footerText);
    doc.text(footerText, (pageW - tw) / 2, pageH - 10);
    doc.setTextColor(0, 0, 0);
  };

  // Helper: draw timestamp top-right
  const drawTimestamp = () => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
    doc.text(ts, pageW - marginR, 12, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // --- First page: header ---
  const drawFirstPageHeader = (): number => {
    let y = 16;

    drawTimestamp();

    // Logo — square, small
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', marginL, y, 18, 18);
    }
    y += 24;

    // Vehicle name centered
    const displayName = options?.vehicleName
      ? `${options.vehicleName} (${licensePlate})`
      : licensePlate;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    doc.text(displayName, pageW / 2, y, { align: 'center' });
    y += 7;

    // Separator line
    doc.setDrawColor(BRAND.r, BRAND.g, BRAND.b);
    doc.setLineWidth(0.5);
    doc.line(pageW / 2 - 40, y, pageW / 2 + 40, y);
    y += 6;

    // Assigned to
    if (options?.assignedTo) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Assigned to: ${options.assignedTo}`, pageW / 2, y, { align: 'center' });
      y += 5;
    }

    // Customer address
    if (options?.customerAddress) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Customer address: ${options.customerAddress}`, pageW / 2, y, { align: 'center' });
      y += 5;
    }

    doc.setTextColor(0, 0, 0);
    y += 6;
    return y;
  };

  // Build all rows with category grouping
  interface RowData {
    type: 'category' | 'item';
    category?: string;
    no?: number;
    name?: string;
    subcategory?: string;
    missing?: number;
    articleNumber?: string;
  }

  const allRows: RowData[] = [];
  for (const section of sections) {
    const items = allMissing.filter(i => i.item_type === section.type);
    if (items.length === 0) continue;

    // Group by category
    const categories = new Map<string, MissingItem[]>();
    for (const item of items) {
      const cat = item.category || 'Sonstiges';
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(item);
    }

    for (const [cat, catItems] of categories) {
      allRows.push({ type: 'category', category: `Category: ${cat}` });
      let n = 1;
      for (const item of catItems) {
        allRows.push({
          type: 'item',
          no: n++,
          name: item.name,
          subcategory: item.category,
          missing: item.missing,
          articleNumber: item.article_number || '',
        });
      }
    }
  }

  // Render rows across pages
  let y = drawFirstPageHeader();
  y = drawTableHeader(y);
  let currentPage = 1;
  let rowIndex = 0;

  for (const row of allRows) {
    const h = row.type === 'category' ? 8 : rowHeight;

    if (y + h > pageH - 20) {
      drawFooter(currentPage, 0); // placeholder, will fix total later
      doc.addPage();
      currentPage++;
      drawTimestamp();
      y = 16;
      y = drawTableHeader(y);
    }

    if (row.type === 'category') {
      // Category row — light blue background
      doc.setFillColor(230, 245, 252);
      doc.rect(marginL, y, contentW, rowHeight, 'F');
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      doc.text(row.category || '', col.no + 2, y + rowHeight / 2 + 1);
      doc.setTextColor(0, 0, 0);
      y += rowHeight;
    } else {
      // Alternating row background
      if (rowIndex % 2 === 1) {
        doc.setFillColor(245, 245, 245);
        doc.rect(marginL, y, contentW, rowHeight, 'F');
      }
      // Row border
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(marginL, y + rowHeight, marginL + contentW, y + rowHeight);

      const textY = y + rowHeight / 2 + 1;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(String(row.no || ''), col.no + 2, textY);
      const itemText = doc.splitTextToSize(row.name || '', colWidths.item - 4);
      doc.text(itemText[0], col.item + 2, textY);
      doc.text(doc.splitTextToSize(row.subcategory || '-', colWidths.subcat - 4)[0], col.subcat + 2, textY);
      doc.text(String(row.missing || ''), col.missing + 2, textY);
      doc.text(row.articleNumber || '', col.artNr + 2, textY);

      doc.setTextColor(0, 0, 0);
      y += rowHeight;
      rowIndex++;
    }
  }

  // Draw footer on all pages with correct total
  const totalP = currentPage;
  for (let p = 1; p <= totalP; p++) {
    doc.setPage(p);
    // Clear old footer area
    doc.setFillColor(255, 255, 255);
    doc.rect(0, pageH - 16, pageW, 16, 'F');
    drawFooter(p, totalP);
  }

  const typeLabel = itemType === 'all' ? 'alle' : itemType;
  const dateStr = new Date().toISOString().substring(0, 10);
  const filename = `KLYMA_-_Missing_items_${typeLabel}_in_${options?.vehicleName || 'Vehicle'}_${licensePlate}_${dateStr}.pdf`;
  doc.save(filename);
}
