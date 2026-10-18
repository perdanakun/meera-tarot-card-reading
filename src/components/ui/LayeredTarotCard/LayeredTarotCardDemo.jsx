import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import LayeredTarotCard, { CARD_MOTION } from "./LayeredTarotCard";

/** Complete optional example. Pass a resolved card from data/cards.config.
 * Not mounted by the production app. The caller owns timeline + context. */
export default function LayeredTarotCardDemo({ card, reducedMotion = false }) {
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const reduced = reducedMotion || systemReduced;
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const wrapper = useRef(null);
  const tarot = useRef(null);
  useLayoutEffect(() => {
    let timeline;
    const context = gsap.context(() => {
      const api = tarot.current;
      const m = CARD_MOTION.layers;
      const propsEnd = m.propsAt + m.props + Math.max(0, card.media.props.length - 1) * m.stagger;
      const frameAt = reduced ? CARD_MOTION.reduced : Math.max(m.mainAt + m.main, propsEnd);
      timeline = gsap.timeline();
      api.appendEnter(timeline, 0);
      api.appendFrameDraw(timeline, frameAt);
      api.appendFlip(timeline, frameAt + (reduced ? CARD_MOTION.reduced : CARD_MOTION.frame.total));
    }, wrapper);
    return () => { timeline?.kill(); context.revert(); };
  }, [card, reduced]);
  return <div ref={wrapper} style={{ width: "min(70vw, 300px)", aspectRatio: "2 / 3" }}>
    <LayeredTarotCard ref={tarot} card={card} frameInitiallyHidden reducedMotion={reduced} />
  </div>;
}
