import { ArrowRight } from "lucide-react";
import { TarotCardView } from "./TarotCard";

export default function IntroScene({ deck, entering, onBegin }) {
  const floating = deck.slice(0, 7);
  return (
    <section
      className={`intro-scene ${entering ? "is-entering" : ""}`}
      aria-labelledby="intro-title"
    >
      <div className="ambient-orbit orbit-one" />
      <div className="ambient-orbit orbit-two" />
      <div className="floating-cards" aria-hidden="true">
        {floating.map((card, index) => (
          <div key={card.id} className={`intro-card intro-card-${index}`}>
            <TarotCardView card={card} faceUp compact />
          </div>
        ))}
      </div>
      <div className="intro-copy text-center">
        <p className="eyebrow">A reflective card ritual</p>
        <h1 id="intro-title">
          A little space
          <br />
          <em>to listen to yourself.</em>
        </h1>
        <p className="intro-note">
          Not a prediction. A pause.
          <br />A place to notice what is already there.
        </p>
        <button
          className="primary-button"
          onClick={onBegin}
          disabled={entering}
        >
          Begin <ArrowRight size={16} />
        </button>
      </div>
      <div className="intro-foot">
        <span>Move slowly</span>
        <span className="line" />
        <span>Trust your first feeling</span>
      </div>
      {entering && (
        <div className="entry-vortex" aria-label="Entering the card space">
          <i />
          <i />
          <i />
          <span>Take a breath.</span>
        </div>
      )}
    </section>
  );
}
