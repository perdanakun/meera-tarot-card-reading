import PurrButton from "../ui/PurrButton/PurrButton";
export default function BackButton({ onBack, disabled }) {
  return <PurrButton className="card-select__back" onClick={onBack} disabled={disabled} aria-label="Back to the Purranormal hero page"><span aria-hidden="true">↖</span> Back</PurrButton>;
}
