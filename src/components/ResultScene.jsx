import { TarotCardView } from "./TarotCard";
import "./ResultScene.css";

export default function ResultScene({ selected = [], titleRef, onReset, onReturn }) {
  return (
    <section className="result-scene" aria-labelledby="result-title">
      <header className="result-heading">
        <span className="result-eyebrow">PURRANORMAL / 04</span>
        <h1 id="result-title" tabIndex={-1} ref={titleRef}>Your Purrtune</h1>
        <p>Three cards. A little perspective.</p>
      </header>
      <div className="result-grid">
        {selected.map((card, index) => {
          const title = card.name ?? card.title ?? `Card ${index + 1}`;
          const description = card.meaning ?? card.description ?? card.message;
          return (
            <article className="result-item" key={card.id}>
              <span className="result-number">0{index + 1}</span>
              <div className="result-art" aria-hidden="true">
                <TarotCardView card={card} faceUp />
              </div>
              <h2>{title}</h2>
              {typeof description === "string" && <p>{description}</p>}
            </article>
          );
        })}
      </div>
      <footer className="result-actions">
        <button type="button" onClick={onReturn}>Back to cards</button>
        <button type="button" className="result-primary" onClick={onReset}>Start again ↗</button>
      </footer>
    </section>
  );
}
