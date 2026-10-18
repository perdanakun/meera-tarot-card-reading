import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { cards, cardIndexFromQuery, preloadCard } from "../data/cards.config";
import CardStage, { cardTheme } from "./card-select/CardStage";
import CardThumbStrip from "./card-select/CardThumbStrip";
import BackButton from "./card-select/BackButton";
import { MOTION } from "./card-select/motion";
import "./cardSelect.css";

// GSAP owns stage motion, text swaps, bars, loops and exit. CSS owns only
// thumbnail selection transforms. No element has two animation owners.
export { MOTION } from "./card-select/motion";

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function CardSelectPage({ active = true, showFrame = false, renderFrame }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = useRef(cardIndexFromQuery(params.get("card")));
  const [request, setRequest] = useState({ index: initial.current, serial: 0 });
  const [view, setView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(!document.hidden && active);
  const [layout, setLayout] = useState({ mobile: window.innerWidth <= 800, revision: 0 });
  const reduced = useReducedMotion();
  const root = useRef(null);
  const master = useRef(null); // Exactly one entrance/exit/navigation timeline.
  const context = useRef(null);
  const loops = useRef([]);
  const feedback = useRef(null);
  const visibleRef = useRef(visible);
  const desired = useRef(initial.current);
  const current = useRef(null);
  const pending = useRef(null); // Max one latest target; never a FIFO backlog.
  const isAnimating = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(false);
  const leavingRef = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;
  visibleRef.current = visible;

  const stopLoops = useCallback(() => {
    loops.current.forEach((loop) => loop.kill()); loops.current = [];
  }, []);
  const finishCurrent = useCallback(() => {
    if (isAnimating.current && master.current) {
      // Suppress callbacks: an interrupted timeline cannot commit an old target.
      master.current.progress(1, true).kill(); master.current = null;
    }
    stopLoops(); isAnimating.current = false;
  }, [stopLoops]);

  const select = useCallback((index) => {
    if (leavingRef.current || !activeRef.current || index < 0 || index >= cards.length || desired.current === index) return;
    generation.current += 1;
    pending.current = index;
    desired.current = index;
    finishCurrent();
    setRequest((previous) => ({ index, serial: previous.serial + 1 }));
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set("card", cards[index].urlId); return next;
    }, { replace: true, preventScrollReset: true });
  }, [finishCurrent, setParams]);

  const boundary = useCallback((element) => {
    if (!element || reduced || leavingRef.current) return;
    feedback.current?.kill();
    feedback.current = gsap.fromTo(element, { x: 0 }, { keyframes: [
      { x: -MOTION.feedback.distance }, { x: MOTION.feedback.distance }, { x: 0 },
    ], duration: MOTION.feedback.duration, ease: "sine.inOut", onComplete: () => gsap.set(element, { clearProps: "transform" }) });
  }, [reduced]);
  const step = useCallback((delta) => {
    const next = desired.current + delta;
    if (next < 0 || next >= cards.length) boundary(root.current?.querySelector("[data-thumb-nav]"));
    else select(next);
  }, [select, boundary]);

  const back = useCallback(() => {
    if (leavingRef.current || !activeRef.current) return;
    leavingRef.current = true; generation.current += 1; pending.current = null;
    setLeaving(true); finishCurrent(); feedback.current?.kill();
    master.current = gsap.timeline({ onComplete: () => navigate("/") }); // Change this route if your hero is elsewhere.
    master.current.to(root.current, { opacity: 0, y: reduced ? 0 : 12,
      duration: reduced ? MOTION.reduced.exit : MOTION.exit.back, ease: MOTION.ease.exit });
  }, [navigate, finishCurrent, reduced]);

  useEffect(() => {
    mounted.current = true;
    document.documentElement.classList.add("card-select-open");
    return () => {
      mounted.current = false; generation.current += 1;
      document.documentElement.classList.remove("card-select-open");
      master.current?.kill(); stopLoops(); feedback.current?.kill(); context.current?.revert();
    };
  }, [stopLoops]);

  // Query changes from browser navigation are also honored. Invalid values normalize.
  useEffect(() => {
    const index = cardIndexFromQuery(params.get("card"));
    if (index !== desired.current) {
      generation.current += 1; desired.current = index; pending.current = index;
      finishCurrent(); setRequest((previous) => ({ index, serial: previous.serial + 1 }));
    }
    if (params.get("card") !== cards[index].urlId) setParams((previous) => {
      const next = new URLSearchParams(previous); next.set("card", cards[index].urlId); return next;
    }, { replace: true, preventScrollReset: true });
  }, [params, setParams, finishCurrent]);

  useEffect(() => {
    if (!active || leavingRef.current) return;
    let cancelled = false;
    const token = ++generation.current;
    const index = request.index;
    setLoading(true);
    // Preload all PNG/WebP layers of current AND adjacent cards. Adjacent loads
    // run independently; a slow neighbor cannot delay this entrance.
    preloadCard(cards[index - 1]); preloadCard(cards[index + 1]);
    Promise.all([preloadCard(cards[index]), document.fonts?.ready || Promise.resolve()]).then(() => {
      if (cancelled || token !== generation.current || !mounted.current || leavingRef.current) return;
      const previous = current.current;
      const direction = previous == null || index >= previous ? 1 : -1;
      setView({ incoming: index, outgoing: previous !== index ? previous : null, direction, token });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [request, active]);

  useLayoutEffect(() => {
    if (!view || leavingRef.current) return;
    const incoming = root.current.querySelector('[data-card-scene="incoming"]');
    const outgoing = root.current.querySelector('[data-card-scene="outgoing"]');
    if (!incoming) return;
    current.current = view.incoming;
    isAnimating.current = true;
    stopLoops(); master.current?.kill(); context.current?.revert();
    const card = cards[view.incoming];
    const ctx = gsap.context(() => {
      const inside = (selector) => incoming.querySelectorAll(selector);
      const names = inside("[data-name-word]");
      const props = inside("[data-prop]");
      const bands = inside("[data-prop-band]");
      const wash = inside("[data-wash]");
      const bg = inside("[data-bg]");
      const main = inside("[data-main]");
      const abilities = inside("[data-ability]");
      const stats = inside("[data-stat]");
      const fills = inside("[data-stat-fill]");
      const description = inside("[data-description]");
      const badge = inside("[data-badge]");
      const x = reduced ? 0 : view.direction * MOTION.distance.direction;
      gsap.set(incoming, { opacity: 1 });
      gsap.set(wash, { opacity: 0 });
      gsap.set(bg, { opacity: 0, scale: reduced ? 1 : 1.08 });
      gsap.set(names, { opacity: 0, yPercent: reduced ? 0 : MOTION.distance.name });
      gsap.set(main, { opacity: 0, x, y: reduced ? 0 : MOTION.distance.main });
      gsap.set(bands, { opacity: 0, scale: reduced || card.motion?.propsFrom === "fade" ? 1 : .92, y: reduced || card.motion?.propsFrom === "fade" ? 0 : MOTION.distance.props });
      gsap.set(abilities, { opacity: 0, x: reduced ? 0 : -MOTION.distance.ui });
      gsap.set(stats, { opacity: 0, x: reduced ? 0 : MOTION.distance.ui });
      gsap.set(fills, { scaleX: reduced ? (i, element) => Number(element.dataset.value) : 0, transformOrigin: "left center" });
      gsap.set(description, { opacity: 0, y: reduced ? 0 : 10 });
      gsap.set(badge, { opacity: 0, scale: reduced ? 1 : .8 });
      if (outgoing) {
        // Reconstruct a fully settled outgoing card after a previous context
        // revert. This also makes rapid interrupts deterministic.
        gsap.set(outgoing, { opacity: 1 });
        gsap.set(outgoing.querySelectorAll("[data-wash], [data-bg], [data-main], [data-name-word], [data-prop-band], [data-ability], [data-stat], [data-description], [data-badge]"), { opacity: 1, x: 0, y: 0, yPercent: 0, scale: 1 });
        gsap.set(outgoing.querySelectorAll("[data-breath], [data-float]"), { y: 0, scale: 1 });
        gsap.set(outgoing.querySelectorAll("[data-stat-fill]"), { scaleX: (i, element) => Number(element.dataset.value) });
      }
      const tl = gsap.timeline({ onComplete: () => {
        if (!mounted.current || leavingRef.current || generation.current !== view.token) return;
        isAnimating.current = false;
        if (pending.current === view.incoming) pending.current = null;
      } });
      master.current = tl;
      if (outgoing) {
        tl.to(outgoing.querySelectorAll("[data-ability], [data-stat], [data-description], [data-badge]"), { opacity: 0, duration: reduced ? MOTION.reduced.exit : MOTION.exit.ui, ease: MOTION.ease.exit }, 0);
        tl.to(outgoing.querySelectorAll("[data-prop]"), { opacity: 0, scale: reduced ? 1 : .94, x: -x, duration: reduced ? MOTION.reduced.exit : MOTION.exit.props, ease: MOTION.ease.exit }, 0);
        tl.to(outgoing.querySelectorAll("[data-main]"), { opacity: 0, x: -x, y: reduced ? 0 : MOTION.distance.exitMain, duration: reduced ? MOTION.reduced.exit : MOTION.exit.main, ease: MOTION.ease.exit }, MOTION.exit.mainAt);
        tl.to(outgoing.querySelectorAll("[data-name-word]"), { opacity: 0, duration: reduced ? MOTION.reduced.exit : MOTION.exit.name, ease: MOTION.ease.exit }, MOTION.exit.nameAt);
        tl.to(outgoing, { opacity: 0, duration: reduced ? MOTION.reduced.exit : MOTION.exit.bg, ease: MOTION.ease.exit }, reduced ? 0 : MOTION.exit.fadeAt);
      }
      const start = outgoing && !reduced ? MOTION.exit.overlap : 0;
      if (reduced) {
        tl.to([...wash, ...bg, ...main, ...names, ...bands, ...abilities, ...stats, ...description, ...badge], { opacity: 1, duration: MOTION.reduced.entrance, ease: "sine.out" }, start);
      } else {
        const e = MOTION.entrance;
        tl.to(wash, { opacity: 1, duration: e.bg, ease: MOTION.ease.bg }, start)
          .to(bg, { opacity: 1, scale: 1, duration: e.bg, ease: MOTION.ease.bg }, start)
          .to(names, { opacity: 1, yPercent: 0, duration: e.name, stagger: e.nameStagger, ease: MOTION.ease.text }, start + e.nameAt)
          .to(main, { opacity: 1, x: 0, y: 0, duration: e.main, ease: MOTION.ease.main }, start + e.mainAt);
        Array.from(props).forEach((prop, index) => {
          const propStart = start + e.propsAt + index * e.propStagger;
          tl.to(prop.querySelectorAll("[data-prop-band]"), { opacity: 1, scale: 1, y: 0, duration: e.props, stagger: layout.mobile ? e.bandStagger * .7 : e.bandStagger, ease: card.motion?.propsFrom === "fade" ? MOTION.ease.text : MOTION.ease.props }, propStart);
        });
        tl.to(abilities, { opacity: 1, x: 0, duration: e.ui, stagger: e.uiStagger, ease: MOTION.ease.ui }, start + e.uiAt)
          .to(stats, { opacity: 1, x: 0, duration: e.ui, stagger: e.uiStagger, ease: MOTION.ease.ui }, start + e.uiAt)
          .to(fills, { scaleX: (i, element) => Number(element.dataset.value), duration: e.bars, stagger: e.uiStagger, ease: MOTION.ease.ui }, start + e.barsAt)
          .to(description, { opacity: 1, y: 0, duration: e.description, ease: MOTION.ease.ui }, start + e.descriptionAt)
          .to(badge, { opacity: 1, scale: 1, duration: e.badge, ease: MOTION.ease.props }, start + e.badgeAt);
        tl.call(() => {
          if (generation.current !== view.token || leavingRef.current) return;
          // One breathing loop + at most two prop loops on mobile = max 3.
          const breath = gsap.to(inside("[data-breath]"), { scale: MOTION.loop.breathScale, duration: MOTION.loop.breathHalf, repeat: -1, yoyo: true, ease: MOTION.ease.loop });
          loops.current.push(breath);
          const floating = Array.from(inside("[data-float]")).slice(0, layout.mobile ? MOTION.loop.maxMobileProps : undefined);
          floating.forEach((node, index) => {
            const amplitude = layout.mobile ? MOTION.loop.mobileY : MOTION.loop.desktopY;
            const loop = gsap.fromTo(node, { y: 0 }, { y: index % 2 ? amplitude : -amplitude, duration: MOTION.loop.floatHalf + index * MOTION.loop.extraPhase, delay: index * MOTION.loop.extraPhase, repeat: -1, yoyo: true, ease: MOTION.ease.loop });
            loops.current.push(loop);
          });
          if (!visibleRef.current) loops.current.forEach((loop) => loop.pause());
        });
      }
      if (!visibleRef.current) tl.pause();
    }, root);
    context.current = ctx;
    return () => { master.current?.kill(); stopLoops(); ctx.revert(); };
  }, [view, reduced, layout, stopLoops]);

  useEffect(() => {
    let intersecting = true;
    const update = () => setVisible(active && intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener("visibilitychange", update); update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [active]);
  useEffect(() => {
    if (leavingRef.current) return;
    if (visible) { master.current?.resume(); loops.current.forEach((loop) => loop.resume()); }
    else { master.current?.pause(); loops.current.forEach((loop) => loop.pause()); }
  }, [visible]);

  useEffect(() => {
    let timer;
    let width = document.documentElement.clientWidth;
    const measure = (force = false) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const nextWidth = document.documentElement.clientWidth;
        if (!force && nextWidth === width) return; // Ignore address-bar-only resizes.
        width = nextWidth; finishCurrent();
        setLayout((previous) => ({ mobile: width <= 800, revision: previous.revision + 1 }));
      }, MOTION.layout.debounce);
    };
    const resize = () => measure(false);
    const rotate = () => measure(true);
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", rotate);
    return () => { window.clearTimeout(timer); window.removeEventListener("resize", resize); window.removeEventListener("orientationchange", rotate); };
  }, [finishCurrent]);
  useEffect(() => {
    const key = (event) => {
      if (!active || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
      if (event.key === "Escape") { event.preventDefault(); back(); }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); step(event.key === "ArrowRight" ? 1 : -1); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [active, back, step]);

  const target = cards[request.index];
  const displayed = view ? cards[view.incoming] : target;
  return <section ref={root} className="card-select-page" style={cardTheme(displayed)} aria-label="Purranormal card gallery" aria-busy={loading}>
    <header className="card-select__header"><BackButton onBack={back} disabled={leaving} /><h1>CHOOSE YOUR CARD</h1><span className="card-select__edition">PURRANORMAL / ARCANA</span></header>
    {view && <div className="card-select__scenes" key={view.token}>
      {view.outgoing != null && <CardStage card={cards[view.outgoing]} phase="outgoing" active={false} visible={false} reducedMotion={reduced} />}
      <CardStage card={cards[view.incoming]} phase="incoming" active={active && !leaving} visible={visible} reducedMotion={reduced}
        onSwipe={step} onBoundary={boundary} showFrame={showFrame} renderFrame={renderFrame} />
    </div>}
    {loading && <p className={`card-select__loading ${view ? "is-switching" : ""}`} role="status">Preparing your card…</p>}
    <CardThumbStrip cards={cards} selectedIndex={request.index} onSelect={select} onStep={step} onBoundary={boundary} disabled={leaving || !active} reducedMotion={reduced} />
    <p className="card-select__sr" aria-live="polite" aria-atomic="true">{!loading && view ? `${displayed.number} ${displayed.title} selected` : ""}</p>
  </section>;
}
