import express from 'express';
import cors from 'cors';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPdf } from './pdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const SHOPPING_LIST_PATH = path.join(DATA_DIR, 'shopping_list.csv');
const RECOMMENDED_LIST_PATH = path.join(DATA_DIR, 'recommended_list.csv');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  if (!existsSync(SHOPPING_LIST_PATH)) {
    await writeFile(SHOPPING_LIST_PATH, 'item,quantity\n', 'utf8');
  }
  if (!existsSync(RECOMMENDED_LIST_PATH)) {
    await writeFile(RECOMMENDED_LIST_PATH, 'item\n', 'utf8');
  }
}

function parseCsv(content) {
  const lines = content.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase();
  const isShopping = header.includes('quantity');
  const rows = lines.slice(1);
  return rows.map((line) => {
    const match = line.match(/^"?([^"]*)"?,?\s*(.*)$/) || [null, line, ''];
    const item = (match[1] || line).trim().replace(/^"|"$/g, '');
    const quantity = isShopping ? (match[2] || '').trim().replace(/^"|"$/g, '') : undefined;
    return quantity !== undefined ? { item, quantity } : { item };
  }).filter((r) => r.item);
}

function toCsvShopping(rows) {
  const header = 'item,quantity\n';
  const body = rows.map((r) => `"${(r.item || '').replace(/"/g, '""')}","${(r.quantity || '').replace(/"/g, '""')}"`).join('\n');
  return header + body;
}

function toCsvRecommended(items) {
  const header = 'item\n';
  const body = [...new Set(items)].map((item) => `"${(item || '').replace(/"/g, '""')}"`).join('\n');
  return header + body;
}

app.get('/api/list', async (req, res) => {
  try {
    await ensureDataDir();
    const content = await readFile(SHOPPING_LIST_PATH, 'utf8');
    const rows = parseCsv(content);
    const list = rows.map((r) => ({ item: r.item, quantity: r.quantity || '' }));
    res.json({ list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to read list' });
  }
});

app.post('/api/list', async (req, res) => {
  try {
    await ensureDataDir();
    const { list } = req.body;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: 'list must be an array' });
    }
    const rows = list.map((r) => ({
      item: String(r.item || '').trim(),
      quantity: String(r.quantity ?? '').trim(),
    })).filter((r) => r.item);
    await writeFile(SHOPPING_LIST_PATH, toCsvShopping(rows), 'utf8');
    res.json({ list: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save list' });
  }
});

app.get('/api/recommended', async (req, res) => {
  try {
    await ensureDataDir();
    const content = await readFile(RECOMMENDED_LIST_PATH, 'utf8');
    const rows = parseCsv(content);
    const items = [...new Set(rows.map((r) => r.item).filter(Boolean))];
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to read recommended' });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    await ensureDataDir();
    const shoppingContent = await readFile(SHOPPING_LIST_PATH, 'utf8');
    const recommendedContent = await readFile(RECOMMENDED_LIST_PATH, 'utf8');
    const currentItems = parseCsv(shoppingContent).map((r) => r.item).filter(Boolean);
    const existingRecommended = parseCsv(recommendedContent).map((r) => r.item).filter(Boolean);
    const combined = [...new Set([...existingRecommended, ...currentItems])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    await writeFile(RECOMMENDED_LIST_PATH, toCsvRecommended(combined), 'utf8');
    await writeFile(SHOPPING_LIST_PATH, 'item,quantity\n', 'utf8');
    res.json({ list: [], items: combined });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reset' });
  }
});

app.post('/api/export/pdf', async (req, res) => {
  try {
    const { list } = req.body;
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: 'list must be an array' });
    }
    const pdfBuffer = await createPdf(list);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="shopping-list.pdf"');
    res.send(pdfBuffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

const clientPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientPath)) {
  app.use(express.static(clientPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
