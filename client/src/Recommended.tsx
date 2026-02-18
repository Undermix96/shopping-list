import type { Props } from './types';

const UNCATEGORIZED_KEY = '__uncategorized__';

export function Recommended({ items, categories, onAdd, onUpdate, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <section className="card recommended" aria-label="Recommended for next time">
        <h2 className="card__title">Recommended</h2>
        <p className="recommended__empty">After you reset a list, items will appear here for next time.</p>
      </section>
    );
  }

  const groups = new Map<string, { index: number; name: string; category: string }[]>();
  items.forEach((entry, index) => {
    const key = entry.category?.trim() || UNCATEGORIZED_KEY;
    const group = groups.get(key) ?? [];
    group.push({ index, name: entry.item, category: entry.category || '' });
    groups.set(key, group);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === UNCATEGORIZED_KEY) return 1;
    if (b === UNCATEGORIZED_KEY) return -1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });

  const categoryLabel = (key: string) => (key === UNCATEGORIZED_KEY ? 'Everything else' : key);

  return (
    <section className="card recommended" aria-label="Recommended for next time">
      <h2 className="card__title">Recommended</h2>
      <p className="recommended__hint">
        Tap to add to your list, or edit name/category. Items without a category appear under &quot;Everything
        else&quot;.
      </p>
      {sortedKeys.map((key) => {
        const group = groups.get(key)!;
        return (
          <div key={key} className="recommended__group">
            <h3 className="recommended__group-title">{categoryLabel(key)}</h3>
            <ul className="recommended__list">
              {group.map(({ index, name, category }) => (
                <li key={`${name}-${index}`} className="recommended__row">
                  <button
                    type="button"
                    className="recommended__chip"
                    onClick={() => onAdd(name, '', category)}
                    title="Add to shopping list"
                  >
                    {name}
                  </button>
                  <input
                    type="text"
                    className="recommended__input recommended__input--name"
                    value={name}
                    onChange={(e) => onUpdate(index, e.target.value, category)}
                    aria-label={`Edit name for ${name}`}
                  />
                  <select
                    className="recommended__input recommended__input--category"
                    value={category}
                    onChange={(e) => onUpdate(index, name, e.target.value)}
                    aria-label={`Category for ${name}`}
                  >
                    <option value="">Everything else</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="recommended__delete"
                    onClick={() => onDelete(index)}
                    aria-label={`Delete ${name} from recommended`}
                    title="Delete from recommended"
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
