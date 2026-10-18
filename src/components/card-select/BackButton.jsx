export default function BackButton({ onBack, disabled }) {
  return <button type="button" className="card-select__back" onClick={onBack} disabled={disabled} aria-label="Back to the Purranormal hero page">
    <span aria-hidden="true">↖</span> BACK
  </button>;
}
