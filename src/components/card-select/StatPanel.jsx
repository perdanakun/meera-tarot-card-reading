export default function StatPanel({ card }) {
  return <dl className="card-stats" aria-label="Playful card stats">
    {Object.entries(card.stats).map(([name, raw]) => {
      const value = Math.max(0, Math.min(100, Number(raw) || 0));
      return <div className="card-stat" data-stat key={name}>
        <div className="card-stat__heading"><dt>{name}</dt><dd>{value}<span className="card-select__sr"> out of 100</span></dd></div>
        <div className="card-stat__track" aria-hidden="true"><span data-stat-fill data-value={value / 100} /></div>
      </div>;
    })}
  </dl>;
}
