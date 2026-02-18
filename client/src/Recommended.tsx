import { useEffect, useRef, useState } from 'react';
import type { Props } from './types';

const UNCATEGORIZED_KEY = '__uncategorized__';

type EditState = {
  open: boolean;
  index: number | null;
  name: string;
  category: string;
};

export function Recommended({ items, categories, onAdd, onUpdate, onDelete }: Props) {
  const [editState, setEditState] = useState<EditState>({
    open: false,
    index: null,
    name: '',
    category: '',
  });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (editState.open) {
      dialog.showModal();
      nameInputRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [editState.open]);

  const openEdit = (index: number, name: string, category: string) => {
    setEditState({
      open: true,
      index,
      name,
      category,
    });
  };

  const handleClose = () => {
    setEditState((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const handleSave = () => {
    if (editState.index == null) return;
    const trimmedName = editState.name.trim();
    const trimmedCategory = editState.category.trim();
    if (!trimmedName) {
      // Don't allow saving empty names; just keep dialog open.
      return;
    }
    onUpdate(editState.index, trimmedName, trimmedCategory);
    setEditState({
      open: false,
      index: null,
      name: '',
      category: '',
    });
  };

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
        Tap to add to your list. Use the menu on each item to edit name or category. Items without a category appear
        under &quot;Everything else&quot;.
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
                  <button
                    type="button"
                    className="recommended__menu"
                    onClick={() => openEdit(index, name, category)}
                    aria-label={`Edit ${name}`}
                    title="Edit name or category"
                  >
                    ⋯
                  </button>
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
      <dialog
        ref={dialogRef}
        className="modal"
        onCancel={handleClose}
        onClose={handleClose}
        aria-labelledby="recommended-edit-title"
      >
        <h2 id="recommended-edit-title" className="modal__title">
          Edit recommended item
        </h2>
        <div className="modal__body">
          <label className="modal__field">
            <span className="modal__label">Name</span>
            <input
              ref={nameInputRef}
              type="text"
              className="add-item__input add-item__input--item"
              value={editState.name}
              onChange={(e) =>
                setEditState((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          </label>
          <label className="modal__field">
            <span className="modal__label">Category</span>
            <select
              className="add-item__input add-item__input--category"
              value={editState.category}
              onChange={(e) =>
                setEditState((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
            >
              <option value="">Everything else</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="modal__actions">
          <button type="button" className="btn btn--secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </dialog>
    </section>
  );
}
