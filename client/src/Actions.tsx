type Props = {
  onExportPdf: () => void;
  onReset: () => void;
  hasItems: boolean;
};

export function Actions({ onExportPdf, onReset, hasItems }: Props) {
  return (
    <section className="actions" aria-label="Actions">
      <button
        type="button"
        className="btn btn--primary actions__btn"
        onClick={onExportPdf}
        disabled={!hasItems}
        title="Download list as PDF (A4, 3 columns)"
      >
        Export PDF
      </button>
      <button
        type="button"
        className="btn btn--secondary actions__btn"
        onClick={onReset}
        disabled={!hasItems}
        title="Clear list and move items to recommended"
      >
        Reset list
      </button>
    </section>
  );
}
