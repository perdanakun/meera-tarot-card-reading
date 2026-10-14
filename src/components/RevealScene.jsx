import React from 'react';
import './RevealScene.css';

export default function RevealScene({selected = [], revealed = [], flipping = [], activeCard, gathering = false, firstButtonRef, onReveal, onContinue}) {
  const allDone = selected.length === 3 && selected.every(card => revealed.includes(card.id)) && flipping.length === 0;
  return <section className={`reveal-scene${gathering ? ' is-gathering' : ''}`} aria-labelledby="reveal-title">
    <header className="reveal-heading"><span className="reveal-eyebrow">MEOWGIC TAROT / 03</span><h1 id="reveal-title">The Reveal</h1><p>Turn your cards, one at a time.</p></header>
    <div className="reveal-grid">{selected.map((card,index) => {
      const open = revealed.includes(card.id); const busy = flipping.includes(card.id);
      const title = card.name ?? card.title ?? `Card ${index + 1}`;
      const image = card.image ?? card.imageUrl ?? card.frontImage ?? null;
      return <button key={card.id} type="button" className={`reveal-card${open ? ' is-open' : ''}${busy ? ' is-flipping' : ''}${activeCard?.id === card.id ? ' is-active' : ''}`} ref={index === 0 ? firstButtonRef : undefined} onClick={() => onReveal?.(card)} disabled={busy || gathering} aria-label={`${open ? 'View' : 'Reveal'} ${title}`} aria-pressed={open}>
        <span className="reveal-card-inner"><span className="reveal-face reveal-back" aria-hidden="true"><span className="reveal-back-symbol">✦</span><span>MEOWGIC</span></span><span className="reveal-face reveal-front" aria-hidden="true">{image ? <img src={image} alt="" /> : <span className="reveal-front-symbol">✧</span>}<span className="reveal-card-name">{title}</span></span></span>
      </button>;
    })}</div>
    <div className="reveal-footer"><p role="status" aria-live="polite">{revealed.length} / {selected.length} cards revealed</p><button className="reveal-continue" type="button" disabled={!allDone || gathering} onClick={onContinue}>{gathering ? 'Gathering…' : 'See your reading →'}</button></div>
  </section>;
}
