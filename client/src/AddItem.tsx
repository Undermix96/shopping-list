import { useState, useRef } from 'react';

type Props = {
  onAdd: (item: string, quantity: string) => void;
};

export function AddItem({ onAdd }: Props) {
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const itemRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = item.trim();
    if (!trimmed) return;
    onAdd(trimmed, quantity.trim());
    setItem('');
    setQuantity('');
    itemRef.current?.focus();
  };

  return (
    <section className="card add-item" aria-label="Add item">
      <h2 className="card__title">Add item</h2>
      <form onSubmit={handleSubmit} className="add-item__form">
        <div className="add-item__row">
          <label htmlFor="item" className="visually-hidden">
            Item name
          </label>
          <input
            ref={itemRef}
            id="item"
            type="text"
            className="add-item__input add-item__input--item"
            placeholder="e.g. Milk"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            autoComplete="off"
            autoFocus
          />
          <label htmlFor="quantity" className="visually-hidden">
            Quantity
          </label>
          <input
            id="quantity"
            type="text"
            className="add-item__input add-item__input--qty"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn--primary add-item__submit">
          Add
        </button>
      </form>
    </section>
  );
}
