import { useEffect, useLayoutEffect, useRef } from "react";
import LayeredTarotCard from "../ui/LayeredTarotCard/LayeredTarotCard";
import PurrButton from "../ui/PurrButton/PurrButton";

export default function CardThumbStrip({ cards, selectedIndex, onSelect, onStep, onBoundary, disabled = false, reducedMotion }) {
  const strip = useRef(null);
  const buttons = useRef([]);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  useLayoutEffect(() => {
    const container = strip.current;
    const selected = buttons.current[selectedIndex];
    if (!container || !selected) return;
    const left = selected.offsetLeft - container.clientWidth / 2 + selected.offsetWidth / 2;
    container.scrollTo({ left, behavior: reducedMotion ? "instant" : "smooth" });
  }, [selectedIndex, reducedMotion]);

  useEffect(() => {
    const container = strip.current;
    if (!container) return;
    let width = container.clientWidth;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth === width) return;
      width = container.clientWidth;
      const selected = buttons.current[selectedIndex];
      if (selected) container.scrollTo({ left: selected.offsetLeft - width / 2 + selected.offsetWidth / 2, behavior: "instant" });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [selectedIndex]);

  function endDrag(event) {
    const point = drag.current;
    if (!point || point.id !== event.pointerId) return;
    suppressClick.current = point.moved;
    if (point.moved && event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    drag.current = null;
  }
  const step = (delta, event) => {
    if (disabled) return;
    const next = selectedIndex + delta;
    if (next < 0 || next >= cards.length) onBoundary(event.currentTarget);
    else onStep(delta);
  };
  return <div className="card-thumb-nav" data-thumb-nav>
    {[-1, 1].map((delta) => <PurrButton key={delta}
      className={`card-thumb-arrow card-thumb-arrow--${delta < 0 ? "prev" : "next"}`}
      aria-label={delta < 0 ? "Previous card" : "Next card"}
      aria-disabled={disabled || (delta < 0 ? selectedIndex === 0 : selectedIndex === cards.length - 1)}
      onClick={(event) => step(delta, event)}>{delta < 0 ? "←" : "→"}</PurrButton>)}
    <div className="card-thumb-strip" ref={strip} role="listbox" aria-label="Choose your tarot card" aria-orientation="horizontal"
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation();
        if (disabled) return;
        const next = event.key === "Home" ? 0 : event.key === "End" ? cards.length - 1 : selectedIndex + (event.key === "ArrowRight" ? 1 : -1);
        if (next < 0 || next >= cards.length) return onBoundary(buttons.current[selectedIndex]);
        onSelect(next); buttons.current[next]?.focus({ preventScroll: true });
      }}
      onPointerDown={(event) => {
        if (disabled || event.button !== 0 || event.isPrimary === false) return;
        suppressClick.current = false;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: event.currentTarget.scrollLeft, moved: false };
      }}
      onPointerMove={(event) => {
        const point = drag.current;
        if (!point || point.id !== event.pointerId) return;
        const dx = event.clientX - point.x;
        if (Math.hypot(dx, event.clientY - point.y) > 10) { point.moved = true; suppressClick.current = true; }
        // Touch keeps native momentum scrolling; only mouse/pen needs manual drag.
        if (point.moved && event.pointerType !== "touch") {
          event.currentTarget.setPointerCapture?.(event.pointerId);
          event.currentTarget.scrollLeft = point.scroll - dx;
        }
      }} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { drag.current = null; }}>
      {cards.map((card, index) => <button type="button" role="option" aria-selected={index === selectedIndex}
        aria-label={`${card.number} ${card.title}`} tabIndex={index === selectedIndex ? 0 : -1}
        ref={(node) => { buttons.current[index] = node; }} key={card.slug}
        className={`card-thumb ${index === selectedIndex ? "is-selected" : ""}`}
        style={{ "--thumb-color": card.theme.primary, "--thumb-accent": card.theme.accent }}
        onClick={(event) => {
          if (disabled || (suppressClick.current && event.detail !== 0)) return;
          onSelect(index);
        }}>
        <span className="card-thumb__glow" aria-hidden="true" />
        <span className="card-thumb__surface"><LayeredTarotCard card={card} decorative selected={index === selectedIndex} reducedMotion={reducedMotion} /><span>{card.number}</span></span>
      </button>)}
    </div>
  </div>;
}
