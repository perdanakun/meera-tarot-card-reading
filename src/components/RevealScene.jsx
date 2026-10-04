import { ArrowRight } from "lucide-react";
import { positions } from "../data/cards";
import { TarotCardView } from "./TarotCard";

export default function RevealScene({
  selected,
  revealed,
  flipping,
  activeCard,
  gathering,
  firstButtonRef,
  onReveal,
  onContinue,
}) {
  const settled = revealed.filter((id) => !flipping.includes(id)).length;
  const complete = revealed.length === 3 && flipping.length === 0;

  const activeLabel =
    activeCard?.keyword ?? activeCard?.archetype ?? "Your reflection";
  const activeTitle =
    activeCard?.meaning ?? activeCard?.keyword ?? activeCard?.name;
  const activeCopy =
    activeCard?.reflection ?? activeCard?.message ?? activeCard?.question;

  return (
    <section
      className={`reveal-scene ${gathering ? "is-gathering" : ""}`}
      aria-labelledby="reveal-title"
    >
      <div className="reveal-orbit" />

      <div className="reveal-intro">
        <p className="eyebrow">The cards have found their place</p>
        <h2 id="reveal-title">These are yours.</h2>
        <p>Reveal them in any order, when you&apos;re ready.</p>
      </div>

      <div className="chosen-row flex items-start justify-center">
        {selected.map((card, index) => {
          const isRevealed = revealed.includes(card.id);
          const isFlipping = flipping.includes(card.id);

          return (
            <div
              key={card.id}
              className={`chosen-slot ${isRevealed ? "has-revealed" : ""}`}
              style={{
                "--gather-x":
                  index === 0
                    ? "calc(100% + var(--card-gap))"
                    : index === 2
                      ? "calc(-100% - var(--card-gap))"
                      : "0%",
                "--gather-r":
                  index === 0 ? "-8deg" : index === 2 ? "7deg" : "1deg",
                "--float-delay": `${index * -0.7}s`,
                "--entrance-r": `${[-4, 1, 4][index]}deg`,
              }}
            >
              <button
                ref={index === 0 ? firstButtonRef : undefined}
                className={`chosen-card ${isRevealed ? "is-revealed" : ""} ${isFlipping ? "is-flipping" : ""}`}
                onClick={() => onReveal(card)}
                aria-label={
                  isRevealed
                    ? `Show message for ${card.name}`
                    : `Reveal ${positions[index]} card`
                }
                disabled={gathering || isFlipping}
              >
                <span className="card-inner">
                  <span className="card-face card-back">
                    <TarotCardView card={card} />
                  </span>
                  <span className="card-face card-front">
                    <TarotCardView
                      card={card}
                      faceUp
                      position={positions[index]}
                    />
                  </span>
                </span>
              </button>

              <span className="position-label">
                0{index + 1} · {positions[index]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="reveal-message" aria-live="polite">
        {activeCard ? (
          <div key={activeCard.id}>
            <p className="reading-label">{activeLabel}</p>
            <h3>{activeTitle}</h3>
            <p>{activeCopy}</p>
          </div>
        ) : (
          <p className="reveal-prompt">
            <span className="tiny-dot" /> Which one calls you first?
          </p>
        )}
      </div>

      <div className="reveal-footer flex justify-center">
        {complete ? (
          <button
            className="primary-button"
            onClick={onContinue}
            disabled={gathering}
          >
            See my reflection <ArrowRight size={16} />
          </button>
        ) : (
          <span className="reveal-count">{settled} / 3 revealed</span>
        )}
      </div>
    </section>
  );
}
