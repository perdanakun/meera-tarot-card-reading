const SYMBOLS = { keyword: "✦", element: "◈", number: "#" };
export default function AbilityPanel({ card }) {
  return <dl className="card-abilities" aria-label="Card attributes">
    {[["keyword", "Keyword", card.keyword], ["element", "Element", card.element], ["number", "Number", card.number]].map(([key, label, value]) => (
      <div className="card-ability" data-ability key={key}>
        <span className="card-ability__icon" aria-hidden="true">{SYMBOLS[key]}</span>
        <div><dt>{label}</dt><dd>{value}</dd></div>
      </div>
    ))}
  </dl>;
}
