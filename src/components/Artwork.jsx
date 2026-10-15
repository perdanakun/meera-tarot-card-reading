import "./Artwork.css";

// Source file: 972 x 1619 px (ratio 972 / 1619).
// Copy the provided image to src/assets/tarot/card-back.png.
import cardBack from "../assets/tarot/card-back.png";
import cardFrontTemplate from "../assets/tarot/card-front-template.png";

export function CardBack() {
  return (
    <span className="artwork-card-back">
      <img className="artwork-card-back-image" src={cardBack} alt="" draggable={false} />
    </span>
  );
}

// UI placeholder only: the individual tarot art will be added later.
export function CardFront({ card, position }) {
  return (
    <span className="artwork-card-front">
      <img className="artwork-card-front-template" src={cardFrontTemplate} alt="" draggable={false} />
      {/* Later: place each card's artwork inside artwork-card-scene. */}
      <span className="artwork-card-scene" aria-hidden="true" />
    </span>
  );
}