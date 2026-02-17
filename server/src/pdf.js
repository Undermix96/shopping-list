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

    const startY = doc.y;
    let y = startY;
    let col = 0;

    list.forEach((entry, index) => {
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

    doc.end();
  });
}
