import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import LayerMedia from "../../card-select/LayerMedia";
import frameSource from "../../../assets/tarot/frame.svg?raw";
import cardBack from "../../../assets/tarot/card-back.png";
import { CARD_MOTION } from "./cardMotion";
import "./layeredTarotCard.css";

export { CARD_MOTION } from "./cardMotion";

/** One registered artwork tree, shared by gallery, thumbnails and detail.
 * Animations are opt-in and append to the CALLER'S timeline/context.
 * mode=scene keeps the master 16:9 shape; mode=card crops it inside 2:3.
 * No portrait replacement, screenshot, canvas flattening or detail.png is used. */
const LayeredTarotCard = forwardRef(function LayeredTarotCard({
  card, mode = "card", showFrame = true, frameInitiallyHidden = false,
  sceneAspect = 16 / 9, animateMedia = false, selected = true, visible = true,
  reducedMotion = false, decorative = false, bandedProps = false,
  betweenLayers = null, mainDragRef, className = "", ...rest
}, forwardedRef) {
  const root = useRef(null);
  const [onscreen, setOnscreen] = useState(false);
  const [awake, setAwake] = useState(() => !document.hidden);
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const reduced = reducedMotion || systemReduced;
  const canPlay = selected && visible && onscreen && awake;
  const elements = () => {
    const element = root.current;
    const q = (selector) => element?.querySelector(selector);
    const all = (selector) => Array.from(element?.querySelectorAll(selector) || []);
    const paths = all(".layered-tarot-card__frame path");
    return {
      root: element, flip: q("[data-card-flip]"), scene: q("[data-card-camera]"),
      drag: q("[data-card-drag]"),
      layers: { bg: q('[data-layer-id="bg"]'), main: q('[data-layer-id="main"]'), props: all("[data-prop]") },
      frame: { element: q(".layered-tarot-card__frame"), paths, outline: paths.slice(0, 1), corners: paths.filter((path, index) => index > 0 && !path.hasAttribute("fill")), ornaments: paths.filter((path) => path.hasAttribute("fill")) },
    };
  };
  const frameProgress = (progress = 1) => {
    const frame = elements().frame;
    if (!frame.element) return;
    const value = Math.max(0, Math.min(1, progress));
    gsap.set(frame.element, { opacity: value > 0 ? 1 : 0 });
    frame.paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length * (1 - value), ...(path.hasAttribute("fill") ? { fillOpacity: value === 1 ? 1 : 0 } : {}) });
    });
  };

  useImperativeHandle(forwardedRef, () => ({
    getElements: elements,
    getLayer(id) { return [elements().layers.bg, elements().layers.main, ...elements().layers.props].find((element) => element?.dataset.layerId === id) || null; },
    setCamera({ scaleX = 1, scaleY = scaleX } = {}) { gsap.set(elements().scene, { scaleX, scaleY }); },
    setFrameProgress: frameProgress,
    appendFrameDraw(timeline, position = 0, overrides = {}) {
      const frame = elements().frame;
      if (!frame.element) return timeline;
      const m = { ...CARD_MOTION.frame, ...overrides };
      frameProgress(0);
      timeline.set(frame.element, { opacity: 1 }, position);
      if (reduced) {
        timeline.to(frame.paths, { strokeDashoffset: 0, fillOpacity: 1, duration: CARD_MOTION.reduced, ease: "sine.out" }, position);
      } else {
        timeline.to(frame.outline, { strokeDashoffset: 0, duration: m.outline, ease: "power2.inOut" }, position);
        if (frame.corners.length) timeline.to(frame.corners, { strokeDashoffset: 0, duration: m.corners, stagger: m.cornerStagger, ease: "power2.out" }, position + m.cornersAt);
        if (frame.ornaments.length) {
          timeline.to(frame.ornaments, { strokeDashoffset: 0, duration: m.ornaments, stagger: m.ornamentStagger, ease: "sine.out" }, position + m.ornamentsAt)
            .to(frame.ornaments, { fillOpacity: 1, duration: m.fill, stagger: m.ornamentStagger, ease: "sine.inOut" }, position + m.fillAt);
        }
      }
      return timeline;
    },
    appendFrameErase(timeline, position = 0, overrides = {}) {
      const frame = elements().frame;
      if (!frame.element) return timeline;
      const duration = reduced ? CARD_MOTION.reduced : (overrides.duration ?? CARD_MOTION.frame.erase);
      timeline.to(frame.paths, { strokeDashoffset: (index, path) => path.getTotalLength(), fillOpacity: 0, duration, ease: "power2.in" }, position)
        .set(frame.element, { opacity: 0 }, position + duration);
      return timeline;
    },
    appendFlip(timeline, position = 0, { turns = 1, duration = CARD_MOTION.flip.duration } = {}) {
      if (!reduced) timeline.to(elements().flip, { rotationY: `+=${turns * 360}`, duration, ease: "power2.inOut" }, position);
      return timeline;
    },
    appendEnter(timeline, position = 0, overrides = {}) {
      const { layers } = elements();
      const list = [layers.bg, layers.main, ...layers.props].filter(Boolean);
      if (reduced) {
        timeline.fromTo(list, { opacity: 0 }, { opacity: 1, duration: CARD_MOTION.reduced, ease: "sine.out" }, position);
      } else {
        const m = { ...CARD_MOTION.layers, ...overrides };
        if (layers.bg) timeline.fromTo(layers.bg, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: m.background, ease: "expo.out" }, position);
        timeline.fromTo(layers.main, { y: m.travel, opacity: 0 }, { y: 0, opacity: 1, duration: m.main, ease: "back.out(1.25)" }, position + m.mainAt);
        if (layers.props.length) timeline.fromTo(layers.props, { scale: .94, opacity: 0 }, { scale: 1, opacity: 1, duration: m.props, stagger: m.stagger, ease: "back.out(1.8)" }, position + m.propsAt);
      }
      return timeline;
    },
  }), [reduced, showFrame, card.slug]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => frameProgress(frameInitiallyHidden ? 0 : 1), root);
    return () => ctx.revert();
  }, [card.slug, showFrame, frameInitiallyHidden]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    const change = () => setAwake(!document.hidden);
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const media = () => setSystemReduced(query.matches);
    document.addEventListener("visibilitychange", change); query.addEventListener("change", media);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", change); query.removeEventListener("change", media); };
  }, []);

  const width = mode === "scene" ? "100%" : `${sceneAspect / (2 / 3) * 100}%`;
  return <div {...rest} ref={root} className={`layered-tarot-card is-${mode}${card.media.placeholder ? " is-placeholder" : ""} ${className}`}
    style={{ "--ltc-scene-width": width, "--ltc-paper": card.theme.primary }}
    role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `${card.number} ${card.title}`} aria-hidden={decorative || undefined}>
    <div className="layered-tarot-card__flip" data-card-flip>
      <div className="layered-tarot-card__front">
        <div className="layered-tarot-card__scene-position">
          <div className="layered-tarot-card__camera" data-card-camera>
            <div className="layered-tarot-card__background" data-bg data-layer-id="bg">
              {card.media.bg && <img src={card.media.bg} decoding="async" alt="" draggable={false} />}
            </div>
            {betweenLayers && <div className="layered-tarot-card__between">{betweenLayers}</div>}
            <div className="layered-tarot-card__main" data-main data-layer-id="main">
              <div className="layered-tarot-card__drag" data-card-drag ref={mainDragRef}>
                <div className="layered-tarot-card__breath" data-breath>
                  <LayerMedia src={card.media.main} webm={animateMedia ? card.media.webm : undefined} mov={animateMedia ? card.media.mov : undefined}
                    selected={selected} visible={canPlay} reducedMotion={reduced} />
                </div>
              </div>
            </div>
            {card.media.props.map((prop, index) => <div className="layered-tarot-card__prop" data-prop data-prop-index={index} data-layer-id={prop.id} key={prop.id}>
              <div className="layered-tarot-card__float" data-float>
                {Array.from({ length: bandedProps ? 4 : 1 }, (_, band) => <div className="layered-tarot-card__band" key={band} style={bandedProps ? { clipPath: `inset(${(3 - band) * 25}% 0 ${band * 25}% 0)` } : undefined}>
                  <img data-prop-band src={prop.src} decoding="async" alt="" draggable={false} />
                </div>)}
              </div>
            </div>)}
          </div>
        </div>
        {showFrame && <span className="layered-tarot-card__frame" style={{ opacity: frameInitiallyHidden ? 0 : 1 }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: frameSource }} />}
      </div>
      <div className="layered-tarot-card__back" aria-hidden="true"><img src={cardBack} alt="" draggable={false} decoding="async" /></div>
    </div>
  </div>;
});
export default LayeredTarotCard;
