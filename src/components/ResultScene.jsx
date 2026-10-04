import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { buildCombinedInsight, resultSections } from "../data/cards";
import { TarotCardView } from "./TarotCard";

export default function ResultScene({ selected, titleRef, onReset, onReturn }) {
  return (
    <section className="result-scene" aria-labelledby="result-title">
      <div className="result-heading">
        <p className="eyebrow">Your reflection</p>
        <h2 id="result-title" ref={titleRef} tabIndex={-1}>
          The message is already
          <br />
          <em>taking shape.</em>
        </h2>
        <p>
          Take what feels useful. Leave what doesn&apos;t. You know your story
          best.
        </p>
      </div>

      <div className="result-layout grid items-start">
        <div className="result-visual" aria-label="Your three selected cards">
          <div className="result-stack">
            {selected.map((card, index) => (
              <button
                type="button"
                key={card.id}
                className={`result-card result-card-${index}`}
                onClick={onReturn}
                aria-label={`View ${card.name} with all three cards`}
              >
                <TarotCardView card={card} faceUp />
              </button>
            ))}
          </div>
          <p>Your three little companions</p>
          <button className="text-button view-cards" onClick={onReturn}>
            <ArrowLeft size={14} /> View all three cards
          </button>
        </div>

        <div className="reading">
          <p className="eyebrow">A note to yourself</p>
          {selected.map((card, index) => (
            <article key={card.id} className="reading-block">
              <span className="reading-index">0{index + 1}</span>
              <div>
                <p className="reading-label">{resultSections[index]}</p>
                <h3>{card.meaning}</h3>
                <p>{index === 2 ? card.question : card.reflection}</p>
              </div>
            </article>
          ))}
          <article className="combined">
            <p className="reading-label">Something to sit with</p>
            <p className="combined-copy">{buildCombinedInsight(selected)}</p>
          </article>
          <div className="result-actions">
            <button className="text-button" onClick={onReset}>
              <RotateCcw size={15} /> Reflect again
            </button>
            <button className="outline-button" onClick={() => window.print()}>
              Save this reflection <Check size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
