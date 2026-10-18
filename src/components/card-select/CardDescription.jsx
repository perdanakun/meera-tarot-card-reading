export default function CardDescription({ card }) {
  return <div className="card-description" data-description>
    <h2>{card.number} <span aria-hidden="true">/</span> {card.title}</h2>
    <p>{card.description}</p>
  </div>;
}
