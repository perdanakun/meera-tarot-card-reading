import { CardBack, CardFront } from "./Artwork";

export function TarotCardView({
  card,
  faceUp = false,
  compact = false,
  position,
}) {
  return (
    <span
      className={`tarot-card ${
        faceUp ? "face-up" : "face-down"
      } ${
        compact ? "compact" : ""
      }`}
    >
      {faceUp ? (
        <span className="tarot-front">
          <CardFront
            card={card}
            position={position}
          />
        </span>
      ) : (
        <span className="tarot-back">
          <CardBack />
        </span>
      )}
    </span>
  );
}