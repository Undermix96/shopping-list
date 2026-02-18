import { useState, useEffect, useCallback } from 'react';
import {
  fetchList,
  saveList,
  fetchRecommended,
  resetList,
  downloadPdf,
  saveRecommended,
  type ListEntry,
  type RecommendedItem,
} from './api';
import { AddItem } from './AddItem';
import { List } from './List';
import { Recommended } from './Recommended';
import { ResetConfirm } from './ResetConfirm';
import { Actions } from './Actions';
import './App.css';

export default function App() {
  const [list, setList] = useState<ListEntry[]>([]);
  const [recommended, setRecommended] = useState<RecommendedItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [listData, recData] = await Promise.all([fetchList(), fetchRecommended()]);
      setList(listData);
      setRecommended(recData);
      const cats = new Set<string>();
      listData.forEach((entry) => {
        const c = entry.category?.trim();
        if (c) cats.add(c);
      });
      recData.forEach((entry) => {
        const c = entry.category?.trim();
        if (c) cats.add(c);
      });
      setCategories(Array.from(cats).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = useCallback(
    async (item: string, quantity: string, category: string) => {
      const entry: ListEntry = { item: item.trim(), quantity: quantity.trim(), category: category.trim() };
      if (!entry.item) return;
      const next = [...list, entry];
      setList(next);
      if (entry.category) {
        setCategories((prev) =>
          prev.includes(entry.category)
            ? prev
            : [...prev, entry.category].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        );
      }
      try {
        await saveList(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save');
      }
    },
    [list]
  );

  const removeItem = useCallback(
    async (index: number) => {
      const next = list.filter((_, i) => i !== index);
      setList(next);
      try {
        await saveList(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save');
      }
    },
    [list]
  );

  const updateQuantity = useCallback(
    async (index: number, quantity: string) => {
      const next = list.map((entry, i) =>
        i === index ? { ...entry, quantity: quantity.trim() } : entry
      );
      setList(next);
      try {
        await saveList(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save');
      }
    },
    [list]
  );

  const updateCategory = useCallback(
    async (index: number, category: string) => {
      const next = list.map((entry, i) =>
        i === index ? { ...entry, category: category.trim() } : entry
      );
      setList(next);
      const trimmed = category.trim();
      if (trimmed) {
        setCategories((prev) =>
          prev.includes(trimmed)
            ? prev
            : [...prev, trimmed].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        );
      }
      try {
        await saveList(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save');
      }
    },
    [list]
  );

  const updateRecommendedItem = useCallback(
    async (index: number, item: string, category: string) => {
      const next = recommended.map((entry, i) =>
        i === index ? { item: item.trim(), category: category.trim() } : entry
      );
      setRecommended(next);
      const trimmed = category.trim();
      if (trimmed) {
        setCategories((prev) =>
          prev.includes(trimmed)
            ? prev
            : [...prev, trimmed].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        );
      }
      try {
        await saveRecommended(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save recommended');
      }
    },
    [recommended]
  );

  const deleteRecommendedItem = useCallback(
    async (index: number) => {
      const next = recommended.filter((_, i) => i !== index);
      setRecommended(next);
      try {
        await saveRecommended(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save recommended');
      }
    },
    [recommended]
  );

  const handleReset = useCallback(async () => {
    try {
      const { list: newList, items } = await resetList();
      setList(newList);
      setRecommended(items);
      setResetOpen(false);
      const cats = new Set<string>();
      newList.forEach((entry) => {
        const c = entry.category?.trim();
        if (c) cats.add(c);
      });
      items.forEach((entry) => {
        const c = entry.category?.trim();
        if (c) cats.add(c);
      });
      setCategories(Array.from(cats).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reset');
    }
  }, []);

  const handleExportPdf = useCallback(async () => {
    try {
      await downloadPdf(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export PDF');
    }
  }, [list]);

  if (loading) {
    return (
      <div className="app app--loading">
        <div className="loader" aria-hidden />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Grocery List</h1>
        <p className="subtitle">Add items and quantities, then export or reset when done.</p>
      </header>

      {error && (
        <div className="banner banner--error" role="alert">
          {error}
          <button type="button" className="banner__dismiss" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <main className="main">
        <AddItem onAdd={addItem} categories={categories} />
        <List
          list={list}
          categories={categories}
          onRemove={removeItem}
          onUpdateQuantity={updateQuantity}
          onUpdateCategory={updateCategory}
        />
        <Recommended
          items={recommended}
          categories={categories}
          onAdd={addItem}
          onUpdate={updateRecommendedItem}
          onDelete={deleteRecommendedItem}
        />
        <Actions
          onExportPdf={handleExportPdf}
          onReset={() => setResetOpen(true)}
          hasItems={list.length > 0}
        />
      </main>

      <ResetConfirm
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        itemCount={list.length}
      />
    </div>
  );
}
