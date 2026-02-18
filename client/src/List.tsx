import type { ListEntry } from './api';

type Props = {
  list: ListEntry[];
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: string) => void;
};

export function List({ list, onRemove, onUpdateQuantity }: Props) {
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
