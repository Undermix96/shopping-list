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
    await writeFile(SHOPPING_LIST_PATH, 'item,quantity,category\n', 'utf8');
  }
  if (!existsSync(RECOMMENDED_LIST_PATH)) {
    await writeFile(RECOMMENDED_LIST_PATH, 'item,category\n', 'utf8');
  }
}

function parseCsv(content) {
  const lines = content.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase();
  const hasQuantity = header.includes('quantity');
  const hasCategory = header.includes('category');
  const rows = lines.slice(1);
  return rows.map((line) => {
    let item = '';
    let quantity;
    let category;

    let m;
    // Prefer strict CSV with quotes for known schemas
    if (hasQuantity && hasCategory) {
      m = line.match(/^"([^"]*)","([^"]*)","([^"]*)"$/);
      if (m) {
        item = m[1];
        quantity = m[2];
        category = m[3];
      }
    } else if (hasQuantity || hasCategory) {
      // Two-column formats: item + quantity OR item + category
      m = line.match(/^"([^"]*)","([^"]*)"$/);
      if (m) {
        item = m[1];
        if (hasQuantity) {
          quantity = m[2];
        } else if (hasCategory) {
          category = m[2];
        }
      }
    }

    // Fallback to legacy loose parsing if pattern didn't match
    if (!m) {
      const match = line.match(/^"?([^"]*)"?,?\s*(.*)$/) || [null, line, ''];
      item = (match[1] || line).trim().replace(/^"|"$/g, '');
      if (hasQuantity) {
        quantity = (match[2] || '').trim().replace(/^"|"$/g, '');
      }
      if (hasCategory && !hasQuantity) {
        category = (match[2] || '').trim().replace(/^"|"$/g, '');
      }
    }

    const row = {
      item: (item || '').trim(),
    };
    if (hasQuantity) {
      row.quantity = (quantity || '').trim();
    }
    if (hasCategory) {
      row.category = (category || '').trim();
    }
    return row;
  }).filter((r) => r.item);
}

function toCsvShopping(rows) {
  const header = 'item,quantity,category\n';
  const body = rows
    .map(
      (r) =>
        `"${(r.item || '').replace(/"/g, '""')}","${(r.quantity || '').replace(/"/g, '""')}","${(r.category || '').replace(/"/g, '""')}"`
    )
    .join('\n');
  return header + body;
}

function toCsvRecommended(items) {
  const header = 'item,category\n';
  const body = items
    .map((r) => `"${(r.item || '').replace(/"/g, '""')}","${(r.category || '').replace(/"/g, '""')}"`)
    .join('\n');
  return header + body;
}

app.get('/api/list', async (req, res) => {
  try {
    await ensureDataDir();
    const content = await readFile(SHOPPING_LIST_PATH, 'utf8');
    const rows = parseCsv(content);
    const list = rows.map((r) => ({
      item: r.item,
      quantity: r.quantity || '',
      category: r.category || '',
    }));
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
      category: String(r.category ?? '').trim(),
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
    const map = new Map();
    rows.forEach((r) => {
      const key = String(r.item || '').trim().toLowerCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { item: r.item, category: r.category || '' });
      }
    });
    const items = Array.from(map.values()).sort((a, b) =>
      a.item.localeCompare(b.item, undefined, { sensitivity: 'base' })
    );
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
    const shoppingRows = parseCsv(shoppingContent);
    const recommendedRows = parseCsv(recommendedContent);

    const map = new Map();

    // Start from existing recommended items
    recommendedRows.forEach((r) => {
      const key = String(r.item || '').trim().toLowerCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { item: r.item, category: r.category || '' });
      }
    });

    // Add any current shopping list items that aren't already recommended
    shoppingRows.forEach((r) => {
      const key = String(r.item || '').trim().toLowerCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { item: r.item, category: r.category || '' });
      }
    });

    const combined = Array.from(map.values()).sort((a, b) =>
      a.item.localeCompare(b.item, undefined, { sensitivity: 'base' })
    );

    await writeFile(RECOMMENDED_LIST_PATH, toCsvRecommended(combined), 'utf8');
    await writeFile(SHOPPING_LIST_PATH, 'item,quantity,category\n', 'utf8');
    res.json({ list: [], items: combined });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reset' });
  }
});

app.post('/api/recommended', async (req, res) => {
  try {
    await ensureDataDir();
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }
    const rows = items
      .map((r) => ({
        item: String(r.item || '').trim(),
        category: String(r.category ?? '').trim(),
      }))
      .filter((r) => r.item);

    await writeFile(RECOMMENDED_LIST_PATH, toCsvRecommended(rows), 'utf8');
    res.json({ items: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save recommended' });
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

// In Docker the server runs from /app and the built client is copied to /app/client/dist
// __dirname resolves to /app/src, so we only need to go up one level to reach /app
const clientPath = path.join(__dirname, '..', 'client', 'dist');
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
