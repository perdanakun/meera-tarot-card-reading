import "./Artwork.css";

import cardBack from "../assets/tarot/card-back.png";
import cardFrontTemplate from "../assets/tarot/card-front-template.png";

/* =====================================================
   CARD BACK
===================================================== */

export function CardBack() {
  return (
    <span className="artwork-card-back">
      <img
        className="artwork-card-back-image"
        src={cardBack}
        alt=""
        draggable={false}
      />
    </span>
  );
}

/* =====================================================
   CARD FRONT
===================================================== */

export function CardFront() {
  return (
    <span className="artwork-card-front">
      <img
        className="artwork-card-front-template"
        src={cardFrontTemplate}
        alt=""
        draggable={false}
      />

      {/*
        Individual artwork sengaja dikosongkan dulu.

        Nanti strukturnya:

        <span className="artwork-card-scene">
          <img
            src={card.artwork}
            className="artwork-card-main"
          />
        </span>

        Jadi artwork bisa dianimasikan secara independen
        dari frame kartu.
      */}
    </span>
  );
}