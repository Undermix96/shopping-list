import type { ListEntry } from './api';

type Props = {
  list: ListEntry[];
  onRemove: (index: number) => void;
};

export function List({ list, onRemove }: Props) {
  if (list.length === 0) {
    return (
      <section className="card list" aria-label="Shopping list">
        <h2 className="card__title">Your list</h2>
        <p className="list__empty">No items yet. Add some above or pick from recommended.</p>
      </section>
    );
  }

  return (
    <section className="card list" aria-label="Shopping list">
      <h2 className="card__title">Your list</h2>
      <ul className="list__items">
        {list.map((entry, index) => (
          <li key={`${entry.item}-${index}`} className="list__row">
            <span className="list__cell list__cell--item">{entry.item}</span>
            {entry.quantity ? (
              <span className="list__cell list__cell--qty">{entry.quantity}</span>
            ) : null}
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
    </section>
  );
}
