import type { Props } from './types';

export function Recommended({ items, onAdd }: Props) {
  if (items.length === 0) {
    return (
      <section className="card recommended" aria-label="Recommended for next time">
        <h2 className="card__title">Recommended</h2>
        <p className="recommended__empty">After you reset a list, items will appear here for next time.</p>
      </section>
    );
  }

  return (
    <section className="card recommended" aria-label="Recommended for next time">
      <h2 className="card__title">Recommended</h2>
      <p className="recommended__hint">Tap to add to your list (no quantity).</p>
      <ul className="recommended__chips">
        {items.map((name) => (
          <li key={name}>
            <button
              type="button"
              className="recommended__chip"
              onClick={() => onAdd(name, '')}
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
