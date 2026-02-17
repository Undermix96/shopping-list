import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemCount: number;
};

export function ResetConfirm({ open, onClose, onConfirm, itemCount }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={handleClose}
      onClose={handleClose}
      aria-labelledby="reset-title"
      aria-describedby="reset-desc"
    >
      <h2 id="reset-title" className="modal__title">
        Reset list?
      </h2>
      <p id="reset-desc" className="modal__text">
        {itemCount > 0
          ? `This will clear your current list and add all ${itemCount} item${itemCount === 1 ? '' : 's'} to the recommended list for next time. You can't undo this.`
          : 'This will clear your list. You can\'t undo this.'}
      </p>
      <div className="modal__actions">
        <button type="button" ref={cancelRef} className="btn btn--secondary" onClick={handleClose}>
          Cancel
        </button>
        <button type="button" className="btn btn--danger" onClick={handleConfirm}>
          Reset list
        </button>
      </div>
    </dialog>
  );
}
