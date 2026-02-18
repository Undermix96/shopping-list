import PDFDocument from 'pdfkit';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 40;
const COLS = 3;
const ROW_HEIGHT = 24;
const FONT_SIZE = 11;

export function createPdf(list) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const contentWidth = A4_WIDTH - 2 * MARGIN;
    const colWidth = contentWidth / COLS;

    doc.fontSize(18).text('Shopping List', MARGIN, MARGIN);
    doc.moveDown(0.5);
    doc.fontSize(FONT_SIZE);

    const groups = new Map();
    list.forEach((entry) => {
      const category = String(entry.category || '').trim();
      const key = category || '__uncategorized__';
      const group = groups.get(key) || [];
      group.push(entry);
      groups.set(key, group);
    });

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (a === '__uncategorized__') return 1;
      if (b === '__uncategorized__') return -1;
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });

    const categoryLabel = (key) => (key === '__uncategorized__' ? 'Everything else' : key);

    let y = doc.y;
    let col = 0;

    sortedKeys.forEach((key, groupIndex) => {
      const entries = groups.get(key) || [];
      if (!entries.length) return;

      if (groupIndex > 0) {
        y += ROW_HEIGHT;
      }

      if (y + ROW_HEIGHT > A4_HEIGHT - MARGIN) {
        doc.addPage({ size: 'A4', margin: MARGIN });
        y = MARGIN;
      }

      doc.fontSize(FONT_SIZE + 1).text(categoryLabel(key), MARGIN, y, {
        width: contentWidth,
      });
      doc.fontSize(FONT_SIZE);
      y += ROW_HEIGHT;
      col = 0;

      entries.forEach((entry, index) => {
        const item = String(entry.item || '').trim();
        const qty = String(entry.quantity ?? '').trim();
        const text = qty ? `${index + 1}. ${item} — ${qty}` : `${index + 1}. ${item}`;
        const x = MARGIN + col * colWidth;

        if (y + ROW_HEIGHT > A4_HEIGHT - MARGIN) {
          doc.addPage({ size: 'A4', margin: MARGIN });
          y = MARGIN;
          col = 0;
        }

        doc.text(text, x, y, { width: colWidth - 8, continued: false });

        col += 1;
        if (col >= COLS) {
          col = 0;
          y += ROW_HEIGHT + 4;
        }
      });
    });

    doc.end();
  });
}
