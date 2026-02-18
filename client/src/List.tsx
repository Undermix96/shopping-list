import type { ListEntry } from './api';

type Props = {
  list: ListEntry[];
  categories: string[];
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: string) => void;
  onUpdateCategory: (index: number, category: string) => void;
};

export function List({ list, categories, onRemove, onUpdateQuantity, onUpdateCategory }: Props) {
  if (list.length === 0) {
    return (
      <section className="card list" aria-label="Shopping list">
        <h2 className="card__title">Your list</h2>
        <p className="list__empty">No items yet. Add some above or pick from recommended.</p>
      </section>
    );
  }

  const groups = new Map<string, { index: number; entry: ListEntry }[]>();
  list.forEach((entry, index) => {
    const key = entry.category?.trim() || '__uncategorized__';
    const group = groups.get(key) ?? [];
    group.push({ index, entry });
    groups.set(key, group);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === '__uncategorized__') return 1;
    if (b === '__uncategorized__') return -1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });

  const categoryLabel = (key: string) => (key === '__uncategorized__' ? 'Everything else' : key);

  return (
    <section className="card list" aria-label="Shopping list">
      <h2 className="card__title">Your list</h2>
      {sortedKeys.map((key) => {
        const items = groups.get(key)!;
        return (
          <div key={key} className="list__category">
            <h3 className="list__category-title">{categoryLabel(key)}</h3>
            <ul className="list__items">
              {items.map(({ entry, index }) => (
                <li key={`${entry.item}-${index}`} className="list__row">
                  <span className="list__cell list__cell--item">{entry.item}</span>
                  <label className="visually-hidden" htmlFor={`qty-${index}`}>
                    Quantity for {entry.item}
                  </label>
                  <input
                    id={`qty-${index}`}
                    type="text"
                    className="list__cell list__cell--qty-input"
                    placeholder="Qty"
                    value={entry.quantity}
                    onChange={(e) => onUpdateQuantity(index, e.target.value)}
                  />
                  <label className="visually-hidden" htmlFor={`cat-${index}`}>
                    Category for {entry.item}
                  </label>
                  <select
                    id={`cat-${index}`}
                    className="list__cell list__cell--category"
                    value={entry.category}
                    onChange={(e) => onUpdateCategory(index, e.target.value)}
                  >
                    <option value="">Everything else</option>
                    {categories.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="list__remove"
                    onClick={() => onRemove(index)}
                    aria-label={`Remove ${entry.item}`}
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
