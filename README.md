# Grocery Shopping List

A shared, mobile-first grocery list with PDF export and a recommended list. Data is stored in CSV files on the server so the list is shared between all users.

## Features

- **Add items** with optional quantity
- **Recommended list** — after reset, all items (without quantity) are saved and shown as chips to quickly add to the next list
- **Export PDF** — A4, 3 columns, table-style list
- **Reset** — clear the list and move items to recommended (with confirmation)
- **Responsive, mobile-first** UI

## Run locally (development)

```bash
# Backend
cd server && npm install && npm run dev

# Frontend (another terminal)
cd client && npm install && npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to the backend on port 3000.

## Run with Docker

```bash
docker compose up --build
```

Open http://localhost:3000. Data is persisted in the `shopping-data` volume.

## Environment

| Variable   | Default     | Description        |
|-----------|-------------|--------------------|
| `PORT`    | `3000`      | Server port        |
| `DATA_DIR`| `server/data` | Directory for CSV files (use `/data` in Docker) |

## Tech

- **Frontend:** React 19, Vite 6, TypeScript
- **Backend:** Node.js (ESM), Express, PDFKit
- **Storage:** CSV files (`shopping_list.csv`, `recommended_list.csv`)

## Changelog

### 0.5

- **Recommended editing in popup**: Editing the name and category of recommended items now happens in a dedicated modal dialog opened from a menu on each item, instead of inline inputs.
- **Recommended items reflect list state**: Recommended items that are already present in the shopping list are visually dimmed, non-clickable chips; if the item is removed from the list, the corresponding recommended chip becomes clickable again.
- **Unique items in the shopping list**: The app now prevents adding duplicate items (case-insensitive) to the shopping list from both the add form and the recommended list, showing an error message if a duplicate is attempted.
