import PDFDocument from 'pdfkit';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 40;

// Layout: 2 columns with a clean table per category
const COLS = 2;
const HEADER_FONT_SIZE = 18;
const CATEGORY_FONT_SIZE = 12;
const TEXT_FONT_SIZE = 10;
const ROW_HEIGHT = 20;

// Color palette (works in grayscale as clear contrasts)
const COLORS = {
  title: '#1F2933', // dark slate
  subtitle: '#6B7280', // muted gray
  categoryBg: '#E5E7EB', // light gray
  headerRule: '#D1D5DB', // soft divider
  checkboxBorder: '#9CA3AF', // medium gray
  checkboxFill: '#F3F4F6', // subtle fill
  itemText: '#111827', // near-black
  quantityText: '#4B5563', // mid-gray
};

function groupByCategory(list) {
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
  return {
    keys: sortedKeys,
    groups,
  };
}

function categoryLabel(key) {
  return key === '__uncategorized__' ? 'Everything else' : key;
}

function drawHeader(doc, createdAt) {
  doc
    .fontSize(HEADER_FONT_SIZE)
    .fillColor(COLORS.title)
    .text('Shopping List', MARGIN, MARGIN, { align: 'left' });

  const headerBottom = doc.y + 4;

  doc
    .fontSize(TEXT_FONT_SIZE)
    .fillColor(COLORS.subtitle)
    .text(createdAt, MARGIN, headerBottom, { align: 'left' });

  const ruleY = headerBottom + 16;
  doc
    .moveTo(MARGIN, ruleY)
    .lineTo(A4_WIDTH - MARGIN, ruleY)
    .lineWidth(0.5)
    .strokeColor(COLORS.headerRule)
    .stroke();

  return ruleY + 12;
}

function ensureSpace(doc, neededHeight, currentY) {
  if (currentY + neededHeight > A4_HEIGHT - MARGIN) {
    doc.addPage({ size: 'A4', margin: MARGIN });
    return MARGIN;
  }
  return currentY;
}

function drawCategoryBlock(doc, x, y, width, key, entries) {
  const headerHeight = ROW_HEIGHT;
  const rowHeight = ROW_HEIGHT;

  // Category header background
  doc
    .save()
    .rect(x, y, width, headerHeight)
    .fillColor(COLORS.categoryBg)
    .fill()
    .restore();

  doc
    .fontSize(CATEGORY_FONT_SIZE)
    .fillColor(COLORS.title)
    .text(categoryLabel(key), x + 8, y + 6, {
      width: width - 16,
      align: 'left',
    });

  let currentY = y + headerHeight;

  // Column headers (Item / Qty)
  const itemColWidth = width * 0.7;
  const qtyColWidth = width * 0.3;
  const headerY = currentY;

  doc
    .fontSize(TEXT_FONT_SIZE)
    .fillColor(COLORS.subtitle)
    .text('Item', x + 22, headerY + 3, { width: itemColWidth - 26 });

  doc
    .fontSize(TEXT_FONT_SIZE)
    .fillColor(COLORS.subtitle)
    .text('Qty', x + itemColWidth + 4, headerY + 3, { width: qtyColWidth - 8, align: 'right' });

  currentY += rowHeight;

  // Items
  entries.forEach((entry) => {
    const item = String(entry.item || '').trim();
    const qty = String(entry.quantity ?? '').trim();

    // Row background alternating for readability
    const isEven = (currentY / rowHeight) % 2 < 1;
    if (isEven) {
      doc
        .save()
        .rect(x, currentY - 2, width, rowHeight)
        .fillColor('#F9FAFB')
        .fill()
        .restore();
    }

    // Checkbox
    const boxSize = 10;
    const boxX = x + 6;
    const boxY = currentY + (rowHeight - boxSize) / 2;
    doc
      .save()
      .rect(boxX, boxY, boxSize, boxSize)
      .lineWidth(0.8)
      .strokeColor(COLORS.checkboxBorder)
      .stroke()
      .fillColor(COLORS.checkboxFill)
      .fill()
      .restore();

    // Item text
    doc
      .fontSize(TEXT_FONT_SIZE)
      .fillColor(COLORS.itemText)
      .text(item, x + 22, currentY + 3, {
        width: itemColWidth - 26,
      });

    // Quantity text
    if (qty) {
      doc
        .fontSize(TEXT_FONT_SIZE)
        .fillColor(COLORS.quantityText)
        .text(qty, x + itemColWidth + 4, currentY + 3, {
          width: qtyColWidth - 8,
          align: 'right',
        });
    }

    currentY += rowHeight;
  });

  return currentY;
}

export function createPdf(list) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { keys, groups } = groupByCategory(list);
    const createdAt = new Date().toLocaleString();

    let y = drawHeader(doc, createdAt);

    const contentWidth = A4_WIDTH - 2 * MARGIN;
    const colWidth = (contentWidth - 16) / COLS; // 16px gutter between columns

    let colIndex = 0;

    keys.forEach((key) => {
      const entries = groups.get(key) || [];
      if (!entries.length) return;

      const approxHeight = ROW_HEIGHT * (entries.length + 2); // header + column headers + rows
      y = ensureSpace(doc, approxHeight, y);

      const x = MARGIN + colIndex * (colWidth + 16);
      const endY = drawCategoryBlock(doc, x, y, colWidth, key, entries);

      colIndex += 1;

      if (colIndex >= COLS) {
        colIndex = 0;
        y = endY + 12;
      }
    });

    doc.end();
  });
}
