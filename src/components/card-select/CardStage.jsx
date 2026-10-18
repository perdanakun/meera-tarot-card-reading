import { useRef } from "react";
import LayeredTarotCard from "../ui/LayeredTarotCard/LayeredTarotCard";
import AbilityPanel from "./AbilityPanel";
import StatPanel from "./StatPanel";
import { MOTION } from "./motion";

export function cardTheme(card) {
  return { "--title-fit": `${90 / (Math.max(...card.title.split(" ").map((word) => word.length)) * .72)}vw`, "--meera-primary": card.theme.primary, "--card-accent": card.theme.accent, "--card-bg": card.theme.bg, "--card-text": card.theme.text };
}

export default function CardStage({ card, phase, active, visible, reducedMotion, onSwipe, onBoundary, showFrame = false, renderFrame }) {
  const pointer = useRef(null);
  const follow = useRef(null);
  const resetFollow = () => {
    if (follow.current) follow.current.style.transform = "translate3d(0,0,0)";
  };
  const cancel = (event) => {
    if (event?.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointer.current = null;
    resetFollow();
  };
  return <article className={`card-select__scene is-${phase}${card.media.placeholder ? " is-placeholder" : ""}`} style={cardTheme(card)} data-card-scene={phase}
    aria-hidden={!active || undefined} inert={!active}>
    <div className="card-select__wash" data-wash>
      {card.media.page && <img className="card-page-background" src={card.media.page} alt="" decoding="async" draggable="false" />}
    </div>
    <div className="card-stage" data-stage
      onPointerDown={(event) => {
        if (!active || event.isPrimary === false || event.button !== 0) return;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0, vertical: false };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        const point = pointer.current;
        if (!point || point.id !== event.pointerId) return;
        point.dx = event.clientX - point.x; point.dy = event.clientY - point.y;
        if (Math.abs(point.dy) > MOTION.gesture.tap && Math.abs(point.dy) >= Math.abs(point.dx)) point.vertical = true;
        if (point.vertical || reducedMotion) return;
        if (Math.abs(point.dx) > MOTION.gesture.tap && follow.current) {
          const x = Math.max(-MOTION.distance.swipeMax, Math.min(MOTION.distance.swipeMax, point.dx * .18));
          follow.current.style.transform = `translate3d(${x}px,0,0)`;
        }
      }}
      onPointerUp={(event) => {
        const point = pointer.current;
        if (point && point.id === event.pointerId && !point.vertical && Math.abs(point.dx) >= MOTION.gesture.swipe && Math.abs(point.dx) > Math.abs(point.dy) * MOTION.gesture.horizontalRatio) {
          onSwipe(point.dx < 0 ? 1 : -1, onBoundary);
        }
        cancel(event);
      }} onPointerCancel={cancel} onLostPointerCapture={() => { pointer.current = null; resetFollow(); }}>
      <div className="card-stage__canvas" data-canvas>
        <LayeredTarotCard card={card} mode="scene" showFrame={false} decorative bandedProps
          animateMedia selected={active} visible={visible} reducedMotion={reducedMotion} mainDragRef={follow}
          betweenLayers={<div className="card-stage__name" aria-hidden="true">
            {card.title.split(" ").map((word, i) => <span className="card-stage__word-mask" key={`${word}-${i}`}><span data-name-word>{word}&nbsp;</span></span>)}
          </div>} />
        {showFrame && renderFrame?.(card)}
      </div>
      <span className="card-stage__badge" data-badge aria-label={`Card ${card.number}`}>{card.number}</span>
    </div>
    <div className="card-select__panels"><AbilityPanel card={card} /><StatPanel card={card} /></div>

  </article>;
}
