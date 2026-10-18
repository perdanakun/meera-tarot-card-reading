import { useEffect, useRef } from "react";
import gsap from "gsap";
import { preloadCard } from "../../data/cards.config";
import PurrButton from "../ui/PurrButton/PurrButton";
import IllustratedPanel from "../ui/IllustratedPanel/IllustratedPanel";
import LayeredTarotCard, { CARD_MOTION } from "../ui/LayeredTarotCard/LayeredTarotCard";
import AbilityPanel from "./AbilityPanel";
import StatPanel from "./StatPanel";
import { MOTION } from "./motion";

/** The SAME artwork layers shrink uniformly; only the outer crop changes shape.
 * inner scale = uniform camera zoom / outer scale, so neither axis stretches.
 * Frame draw and flip are methods on the reusable card, owned by this timeline. */
export default function CardInfoDialog({ card, open, onClose, reducedMotion, active = true }) {
  const dialog = useRef(null);
  const tarot = useRef(null);
  const timeline = useRef(null);
  const closeAction = useRef(() => {});
  const phase = useRef("closed");
  const latest = useRef({ onClose, reducedMotion, active });
  latest.current = { onClose, reducedMotion, active };

  useEffect(() => {
    if (!open) return;
    const node = dialog.current;
    let cancelled = false;
    let ctx;
    let resizeTimer;
    if (!node.open) node.showModal();
    node.scrollTop = 0;
    phase.current = "loading"; node.dataset.detailPhase = "loading";
    const q = (selector) => node.querySelector(selector);
    const surface = q("[data-detail-surface]");
    const backdrop = q("[data-detail-backdrop]");
    const copy = q("[data-detail-copy]");
    const controls = q("[data-detail-controls]");
    const slot = q("[data-detail-slot]");
    const camera = { zoom: 1 };
    const d = MOTION.detail;
    const geometry = () => {
      const bounds = node.getBoundingClientRect();
      const box = slot.getBoundingClientRect();
      return { sx: bounds.width / box.width, sy: bounds.height / box.height,
        x: bounds.left + bounds.width / 2 - (box.left + box.width / 2),
        y: bounds.top + bounds.height / 2 - (box.top + box.height / 2) };
    };
    const updateCamera = () => {
      tarot.current?.setCamera({
        scaleX: camera.zoom / Number(gsap.getProperty(surface, "scaleX")),
        scaleY: camera.zoom / Number(gsap.getProperty(surface, "scaleY")),
      });
    };
    const ready = () => {
      phase.current = "ready"; node.dataset.detailPhase = "ready";
      q("[data-detail-back]")?.focus({ preventScroll: true });
    };
    const finishClose = () => {
      if (cancelled) return;
      phase.current = "closed"; node.dataset.detailPhase = "closed";
      node.close(); latest.current.onClose();
    };
    closeAction.current = () => {
      if (phase.current === "closing" || phase.current === "closed") return;
      if (phase.current === "loading") return finishClose();
      timeline.current?.kill();
      phase.current = "closing"; node.dataset.detailPhase = "closing";
      const g = geometry();
      ctx.add(() => {
        const tl = gsap.timeline({ onComplete: finishClose, onUpdate: updateCamera });
        timeline.current = tl;
        if (latest.current.reducedMotion) {
          tl.to([surface, copy, controls, backdrop], { opacity: 0, duration: d.reduced, ease: "sine.out" });
        } else {
          const flip = tarot.current.getElements().flip;
          const rotation = Number(gsap.getProperty(flip, "rotationY"));
          const nearest = ((rotation + 180) % 360 + 360) % 360 - 180;
          gsap.set(flip, { rotationY: nearest });
          tl.to([copy, controls], { opacity: 0, y: 10, duration: d.fade, ease: "power2.in" }, 0)
            .to(flip, { rotationY: 0, duration: d.frameErase, ease: "power2.inOut" }, 0);
          tarot.current.appendFrameErase(tl, 0, { duration: d.frameErase });
          tl.to(surface, { x: g.x, y: g.y, scaleX: g.sx, scaleY: g.sy, duration: d.reverse, ease: "power3.inOut" }, d.frameErase)
            .to(camera, { zoom: g.sy, duration: d.reverse, ease: "power3.inOut" }, d.frameErase)
            .set(backdrop, { opacity: 0 }, d.frameErase + d.reverse);
        }
        if (document.hidden || !latest.current.active) tl.pause();
      });
    };
    const visibility = () => {
      if (document.hidden || !latest.current.active) timeline.current?.pause(); else timeline.current?.resume();
    };
    const resize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (phase.current === "loading" || phase.current === "closed") return;
        timeline.current?.kill();
        if (phase.current === "closing") return finishClose();
        gsap.set(surface, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 });
        camera.zoom = 1; tarot.current.setCamera();
        tarot.current.setFrameProgress(1);
        gsap.set(tarot.current.getElements().flip, { rotationY: 0 });
        gsap.set([copy, controls, backdrop], { opacity: 1, y: 0 });
        ready();
      }, MOTION.layout.debounce);
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", resize);
    ctx = gsap.context(() => gsap.set([surface, copy, controls, backdrop], { opacity: 0 }), node);
    preloadCard(card).then(() => {
      if (cancelled || phase.current === "closed") return;
      ctx.add(() => {
        const g = geometry();
        phase.current = "forming"; node.dataset.detailPhase = "forming";
        gsap.set(surface, { x: g.x, y: g.y, scaleX: g.sx, scaleY: g.sy, opacity: 0, transformOrigin: "50% 50%" });
        gsap.set(tarot.current.getElements().flip, { rotationY: 0 });
        camera.zoom = g.sy; updateCamera(); tarot.current.setFrameProgress(0);
        const tl = gsap.timeline({ onComplete: ready, onUpdate: updateCamera });
        timeline.current = tl;
        if (latest.current.reducedMotion) {
          gsap.set(surface, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 0 });
          gsap.set(backdrop, { opacity: 1 });
          camera.zoom = 1; tarot.current.setCamera(); tarot.current.setFrameProgress(1);
          tl.to([surface, copy, controls], { opacity: 1, duration: d.reduced, ease: "sine.out" });
        } else {
          tl.to(surface, { opacity: 1, duration: d.reveal, ease: "sine.out" }, 0)
            .set(backdrop, { opacity: 1 }, d.reveal)
            .to(surface, { scaleX: 1, scaleY: 1, duration: d.form, ease: "power3.inOut" }, d.reveal)
            .to(camera, { zoom: 1, duration: d.form, ease: "power3.inOut" }, d.reveal);
          const frameAt = d.reveal + d.frameAt;
          tarot.current.appendFrameDraw(tl, frameAt);
          const anticipateAt = Math.max(d.reveal + d.form, frameAt + CARD_MOTION.frame.total) + d.hold;
          const flip = tarot.current.getElements().flip;
          tl.to(flip, { rotationY: -10, rotationZ: -2, duration: d.anticipate, ease: "sine.inOut" }, anticipateAt);
          const rotateAt = anticipateAt + d.anticipate;
          tl.to(flip, { rotationY: 360, rotationZ: 0, duration: d.rotate, ease: "power2.inOut" }, rotateAt);
          const moveAt = rotateAt + d.rotate + d.settle;
          tl.to(surface, { x: 0, y: 0, duration: d.move, ease: "power3.inOut" }, moveAt)
            .fromTo(copy, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: d.copy, ease: "power3.out" }, moveAt + d.move * .65)
            .to(controls, { opacity: 1, duration: d.copy, ease: "sine.out" }, moveAt + d.move * .65);
        }
        visibility();
      });
    });
    return () => {
      cancelled = true; clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", resize); window.removeEventListener("orientationchange", resize);
      timeline.current?.kill(); ctx?.revert();
      if (node.open) node.close();
      phase.current = "closed";
    };
  }, [open, card.slug, reducedMotion]);

  useEffect(() => { if (active && !document.hidden) timeline.current?.resume(); else timeline.current?.pause(); }, [active]);

  return <dialog ref={dialog} className="card-detail" aria-labelledby="card-detail-heading" onCancel={(event) => { event.preventDefault(); closeAction.current(); }}>
    <div className="card-detail__backdrop" data-detail-backdrop aria-hidden="true">
      {card.media.page && <img className="card-page-background" src={card.media.page} alt="" decoding="async" draggable="false" />}
      <div className="card-page-vignette" />
    </div>
    <div className="card-detail__slot" data-detail-slot>
      <div className="card-detail__surface" data-detail-surface>
        <LayeredTarotCard ref={tarot} card={card} frameInitiallyHidden decorative selected={open} visible={active} reducedMotion={reducedMotion} />
      </div>
    </div>
    <div className="card-detail__controls" data-detail-controls><PurrButton data-detail-back onClick={() => closeAction.current()}>↖ Back to cards</PurrButton></div>
    <div className="card-detail__copy"><div className="card-detail__copy-motion" data-detail-copy>
      <IllustratedPanel className="illustrated-panel--adventure" aria-labelledby="card-detail-heading">
        <span className="card-detail__number">{card.number}</span><h2 id="card-detail-heading">{card.title}</h2>
        <p className="card-detail__description">{card.description}</p>
        <div className="card-detail__facts"><AbilityPanel card={card} /><StatPanel card={card} /></div>
        {card.details && <p className="card-detail__description">{card.details}</p>}
      </IllustratedPanel>
    </div></div>
  </dialog>;
}
