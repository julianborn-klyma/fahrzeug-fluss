import jsPDF from 'jspdf';

interface ChecklistStep {
  id: string;
  title: string;
  step_type: string;
  is_completed: boolean;
  is_required: boolean;
  text_value?: string | null;
  photo_urls?: string[];
  photo_url?: string | null;
  completed_at?: string | null;
  parent_step_id?: string | null;
  order_index: number;
}

interface ChecklistData {
  name: string;
  status: string;
  steps: ChecklistStep[];
}

interface AppointmentInfo {
  typeName?: string;
  startDate?: string | null;
  endDate?: string | null;
  jobTitle?: string;
  jobNumber?: string;
  status?: string;
  notes?: string;
  assignees?: string[];
}

/** Load an image URL as a base64 data URL and get its natural dimensions */
async function loadImageData(url: string): Promise<{ base64: string; width: number; height: number } | null> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Get natural image dimensions
    const dims: { width: number; height: number } = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 1, height: 1 });
      img.src = base64;
    });

    return { base64, width: dims.width, height: dims.height };
  } catch {
    return null;
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export async function generateChecklistPdf(
  checklist: ChecklistData,
  appointmentInfo: AppointmentInfo,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Header ──
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(checklist.name, margin, y);
  y += 8;

  // ── Appointment info ──
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);

  const infoLines: string[] = [];
  if (appointmentInfo.jobNumber) infoLines.push(`Auftrag: ${appointmentInfo.jobNumber} – ${appointmentInfo.jobTitle || ''}`);
  if (appointmentInfo.typeName) infoLines.push(`Terminart: ${appointmentInfo.typeName}`);
  if (appointmentInfo.startDate) infoLines.push(`Zeitraum: ${formatDate(appointmentInfo.startDate)} – ${formatDate(appointmentInfo.endDate)}`);
  if (appointmentInfo.status) infoLines.push(`Status: ${appointmentInfo.status}`);
  if (appointmentInfo.assignees && appointmentInfo.assignees.length > 0) infoLines.push(`Zugewiesen: ${appointmentInfo.assignees.join(', ')}`);
  if (appointmentInfo.notes) infoLines.push(`Notizen: ${appointmentInfo.notes}`);

  for (const line of infoLines) {
    checkPage(5);
    doc.text(line, margin, y);
    y += 4.5;
  }
  y += 4;

  // ── Progress ──
  const allSteps = checklist.steps.filter(s => s.step_type !== 'group');
  const doneSteps = allSteps.filter(s => s.is_completed);
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  checkPage(8);
  doc.text(`Fortschritt: ${doneSteps.length}/${allSteps.length} (${allSteps.length > 0 ? Math.round((doneSteps.length / allSteps.length) * 100) : 0}%)`, margin, y);
  y += 3;

  // Progress bar
  doc.setDrawColor(200);
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(margin, y, contentW, 3, 1.5, 1.5, 'F');
  if (allSteps.length > 0) {
    const pct = doneSteps.length / allSteps.length;
    doc.setFillColor(34, 139, 34);
    doc.roundedRect(margin, y, contentW * pct, 3, 1.5, 1.5, 'F');
  }
  y += 8;

  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  // ── Steps ──
  const topLevel = checklist.steps.filter(s => !s.parent_step_id).sort((a, b) => a.order_index - b.order_index);
  const childrenOf = (id: string) => checklist.steps.filter(s => s.parent_step_id === id).sort((a, b) => a.order_index - b.order_index);

  const getPhotos = (step: ChecklistStep): string[] => {
    const arr = step.photo_urls || [];
    if (arr.length > 0) return arr.filter(Boolean);
    if (step.photo_url) return [step.photo_url];
    return [];
  };

  const renderStepPdf = async (step: ChecklistStep, indent: number) => {
    if (step.step_type === 'group') {
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(60);
      doc.text(step.title, margin + indent, y);
      y += 6;

      const children = childrenOf(step.id);
      for (const child of children) {
        await renderStepPdf(child, indent + 4);
      }
      y += 2;
      return;
    }

    checkPage(8);

    // Status icon
    doc.setFontSize(10);
    const iconX = margin + indent;
    if (step.is_completed) {
      doc.setTextColor(34, 139, 34);
      doc.text('✓', iconX, y);
    } else {
      doc.setTextColor(180);
      doc.text('○', iconX, y);
    }

    // Title
    doc.setTextColor(step.is_completed ? 120 : 0);
    doc.setFont('helvetica', step.is_completed ? 'normal' : 'normal');
    const titleX = iconX + 6;
    const required = step.is_required ? ' *' : '';
    const titleLines = doc.splitTextToSize(`${step.title}${required}`, contentW - indent - 6);
    doc.text(titleLines, titleX, y);
    y += titleLines.length * 4.5;

    // Text value
    if (step.text_value) {
      checkPage(5);
      doc.setFontSize(8);
      doc.setTextColor(100);
      const valLines = doc.splitTextToSize(`→ ${step.text_value}`, contentW - indent - 10);
      doc.text(valLines, titleX + 2, y);
      y += valLines.length * 3.5;
    }

    // Completed date
    if (step.is_completed && step.completed_at) {
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Erledigt am ${formatDate(step.completed_at)}`, titleX + 2, y);
      y += 3.5;
    }

    // Photos – preserve original aspect ratio
    const photos = getPhotos(step);
    if (photos.length > 0) {
      const maxThumbH = 45;
      const maxThumbW = 60;
      const gap = 3;
      const availableW = contentW - indent - 6;

      for (let i = 0; i < photos.length; i++) {
        try {
          const imgData = await loadImageData(photos[i]);
          if (imgData) {
            // Scale to fit within maxThumbW x maxThumbH while keeping aspect ratio
            const ratio = imgData.width / imgData.height;
            let drawW: number, drawH: number;
            if (ratio >= 1) {
              // Landscape or square
              drawW = Math.min(maxThumbW, availableW);
              drawH = drawW / ratio;
              if (drawH > maxThumbH) { drawH = maxThumbH; drawW = drawH * ratio; }
            } else {
              // Portrait
              drawH = maxThumbH;
              drawW = drawH * ratio;
              if (drawW > Math.min(maxThumbW, availableW)) { drawW = Math.min(maxThumbW, availableW); drawH = drawW / ratio; }
            }

            checkPage(drawH + 4);
            doc.addImage(imgData.base64, 'JPEG', titleX, y, drawW, drawH);
            y += drawH + gap;
          } else {
            checkPage(12);
            doc.setDrawColor(200);
            doc.rect(titleX, y, 30, 10);
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text('Bild nicht verfügbar', titleX + 2, y + 6);
            y += 13;
          }
        } catch {
          checkPage(12);
          doc.setDrawColor(200);
          doc.rect(titleX, y, 30, 10);
          y += 13;
        }
      }
    }

    y += 2;
  };

  for (const step of topLevel) {
    await renderStepPdf(step, 0);
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Seite ${p}/${pageCount} – Erstellt am ${new Date().toLocaleDateString('de-DE')}`,
      margin,
      doc.internal.pageSize.getHeight() - 8,
    );
  }

  const safeName = checklist.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\- ]/g, '').trim();
  doc.save(`${safeName || 'Checkliste'}.pdf`);
}
