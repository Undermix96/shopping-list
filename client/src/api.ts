export type ListEntry = { item: string; quantity: string; category: string };
export type RecommendedItem = { item: string; category: string };

export async function fetchList(): Promise<ListEntry[]> {
  const res = await fetch('/api/list');
  if (!res.ok) throw new Error('Failed to load list');
  const data = await res.json();
  return data.list ?? [];
}

export async function saveList(list: ListEntry[]): Promise<ListEntry[]> {
  const res = await fetch('/api/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ list }),
  });
  if (!res.ok) throw new Error('Failed to save list');
  const data = await res.json();
  return data.list ?? [];
}

export async function fetchRecommended(): Promise<string[]> {
  const res = await fetch('/api/recommended');
  if (!res.ok) throw new Error('Failed to load recommended');
  const data = await res.json();
  return data.items ?? [];
}

export async function resetList(): Promise<{ list: ListEntry[]; items: RecommendedItem[] }> {
  const res = await fetch('/api/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset');
  return res.json();
}

export async function saveRecommended(items: RecommendedItem[]): Promise<RecommendedItem[]> {
  const res = await fetch('/api/recommended', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Failed to save recommended');
  const data = await res.json();
  return data.items ?? [];
}

export async function downloadPdf(list: ListEntry[]): Promise<void> {
  const res = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ list }),
  });
  if (!res.ok) throw new Error('Failed to generate PDF');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shopping-list.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
