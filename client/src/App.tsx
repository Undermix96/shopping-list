import { useState, useEffect, useCallback } from 'react';
import {
  fetchList,
  saveList,
  fetchRecommended,
  resetList,
  downloadPdf,
  type ListEntry,
} from './api';
import { AddItem } from './AddItem';
import { List } from './List';
import { Recommended } from './Recommended';
import { ResetConfirm } from './ResetConfirm';
import { Actions } from './Actions';
import './App.css';

export default function App() {
  const [list, setList] = useState<ListEntry[]>([]);
  const [recommended, setRecommended] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [listData, recData] = await Promise.all([fetchList(), fetchRecommended()]);
      setList(listData);
      setRecommended(recData);
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
    async (item: string, quantity: string) => {
      const entry: ListEntry = { item: item.trim(), quantity: quantity.trim() };
      if (!entry.item) return;
      const next = [...list, entry];
      setList(next);
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

  const handleReset = useCallback(async () => {
    try {
      const { list: newList, items } = await resetList();
      setList(newList);
      setRecommended(items);
      setResetOpen(false);
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
        <AddItem onAdd={addItem} />
        <List list={list} onRemove={removeItem} />
        <Recommended items={recommended} onAdd={addItem} />
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
