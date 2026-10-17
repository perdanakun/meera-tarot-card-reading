

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import "./IntroScene.css";
import PurrHeader from "./ui/PurrHeader/PurrHeader";
import MorphButton, { PAW_OFFSET_Y } from "./ui/MorphButton/MorphButton";

import titleSource from "../assets/background/tittle.svg?raw";
import walk0 from "../assets/background/cat walking_0.svg";
import walk1 from "../assets/background/cat walking_1.svg";
import walk2 from "../assets/background/cat walking_2.svg";
import walk3 from "../assets/background/cat walking_3.svg";
import walk4 from "../assets/background/cat walking_4.svg";
import walk5 from "../assets/background/cat walking_5.svg";

import catAngry from "../assets/background/cat_angry.svg";

import catFrame1 from "../assets/background/cat_hero-01.svg";
import catFrame2 from "../assets/background/cat_hero-02.svg";
import catFrame3 from "../assets/background/cat_hero-03.svg";
import catFrame4 from "../assets/background/cat_hero-04-04.svg";

// Motion controls. Wave speed is seconds per complete, seamless drift.
const EASE = { reveal: "expo.out", settle: "power4.out", cat: "back.out(1.35)" };
const OPENING = {
  beat: 0.4, letterGap: 0.085, letterDrop: 0.78,
  bounceUp: 0.22, bounceDown: 0.24, settle: 0.3,
  walk: 2.65, handoff: 0.3,
};
const CAT_POSE = { duration: 0.35, returnAfter: 1800 };
const WALK_FRAME_MS = 110;
const WALK_FRAMES = [walk0, walk1, walk2, walk3, walk4, walk5];
const PREFIX = "im lucifur son of the darkness, and ill tell your ";
const ORIGINAL = "fortune";
const REPLACEMENT = "purrtune";
const MESSAGE = `${PREFIX}${REPLACEMENT}`;
const CAT_FRAMES = [catFrame1, catFrame2, catFrame3, catFrame4];

// Illustrator's path order is NOT the reading order. Verified against tittle.svg.
// P U R R A N O R M A L, from left to right.
const TITLE_ORDER = [2, 7, 5, 6, 4, 1, 8, 9, 0, 3, 10];
const exportedPaths = Array.from(titleSource.matchAll(/<path\b[^>]*\bd="([^"]+)"/g), match => match[1]);
const TITLE_PATHS = TITLE_ORDER.map(index => exportedPaths[index]).filter(Boolean);

function TitleLine({ from, to, viewBox, className }) {
  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true" focusable="false">
      {TITLE_PATHS.slice(from, to).map((d, index) => (
        <g key={from + index} className="meera-intro__letter" data-letter={from + index}>
          <path d={d} fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

// A pair of interlocking ribbons is drawn along the spiral itself.
// No circular reveal, no stroke-dash endpoint, and no solid-black handoff frame.
const HYPNOSIS_GROWTH = 1.43; // Radius multiplier per complete revolution.
const HYPNOSIS_DURATION = 2; // Same duration in both directions.
const HYPNOSIS_ROTATION = 48; // Degrees; reversed on exit.
const HYPNOSIS_OVERSCAN = 2.4; // Covers corners even at intermediate spiral angles.
const HYPNOSIS_SAMPLES_PER_TURN = 72; // More points = smoother curves, more SVG work.

// EYE: perfectly circular yellow iris and black pupil.
const EYE_CENTER_X = 64;
const EYE_CENTER_Y = 82;
const EYE_IRIS_RADIUS = 15;
const EYE_PUPIL_RADIUS = 6.5;
const EYE_OPEN_DURATION = 0.72;


function makeSpiralGeometry(cx, cy, pupilRadius, requiredRadius) {
  const growthRate = Math.log(HYPNOSIS_GROWTH) / (Math.PI * 2);
  const startRadius = Math.max(1, pupilRadius * 0.42);
  const totalAngle = Math.log(requiredRadius / startRadius) / growthRate;
  const steps = Math.ceil(totalAngle / (Math.PI * 2) * HYPNOSIS_SAMPLES_PER_TURN);
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const theta = -Math.PI / 2 + totalAngle * i / steps;
    const r = startRadius * Math.exp(growthRate * totalAngle * i / steps);
    const x = (multiplier) => `${(cx + r * multiplier * Math.cos(theta)).toFixed(2)},${(cy + r * multiplier * Math.sin(theta)).toFixed(2)}`;
    return { inner: x(1), middle: x(Math.sqrt(HYPNOSIS_GROWTH)), outer: x(HYPNOSIS_GROWTH) };
  });
  return { points, steps, startRadius };
}

// Each ribbon grows from its own moving spiral-shaped tip.
// The black and yellow bands together tile the expanding spiral tunnel.
function ribbonAt(points, progress, innerKey, outerKey) {
  const lastIndex = Math.max(1, Math.min(points.length - 1, Math.ceil(progress * (points.length - 1))));
  const inside = [];
  const outside = [];
  for (let i = 0; i <= lastIndex; i += 1) {
    inside.push(points[i][innerKey]);
    outside.push(points[i][outerKey]);
  }
  return `M ${inside.join(' L ')} L ${outside.reverse().join(' L ')} Z`;
}

export default function IntroScene({
  entering = false,
  arriving = false,
  onBegin,
  onPortalReached,
  onTransitionComplete,
  reducedMotion: reducedMotionProp = false,
}) {
  const [systemReduced, setSystemReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const reducedMotion = reducedMotionProp || systemReduced;
  const [angry, setAngry] = useState(false);
  const [angryReady, setAngryReady] = useState(false);
  const [loopVisible, setLoopVisible] = useState(true);
  const angryRef = useRef(false);
  const poseBusy = useRef(false);
  const poseTimer = useRef(null);
  const poseTimeline = useRef(null);
  const pointerStart = useRef(null);
  const [stage, setStage] = useState("typing");
  const [typedCount, setTypedCount] = useState(0);
  const [catFrame, setCatFrame] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);
  const openingAllowed = useRef(!entering && !arriving);
  const [assetsReady, setAssetsReady] = useState(false);
  const [walkingAvailable, setWalkingAvailable] = useState(true);
  const [openingDone, setOpeningDone] = useState(false);
  const [catSettled, setCatSettled] = useState(false);
  const [catHovered, setCatHovered] = useState(false);
  const [chatPinned, setChatPinned] = useState(false);
  const introRef = useRef(null);
  const catRef = useRef(null);
  const hypnosisRef = useRef(null);
  const actionRef = useRef(null);
  const portalTimelineRef = useRef(null);
  const portalCallbacks = useRef({ onPortalReached, onTransitionComplete });
  portalCallbacks.current = { onPortalReached, onTransitionComplete };
  const [portalLayout, setPortalLayout] = useState(null);
  const spiralGeometry = useMemo(() => portalLayout
    ? makeSpiralGeometry(
        portalLayout.eyeX,
        portalLayout.eyeY,
        portalLayout.size * (EYE_PUPIL_RADIUS / 128),
        Math.hypot(portalLayout.viewportWidth / 2, portalLayout.viewportHeight / 2) * HYPNOSIS_OVERSCAN
      )
    : null, [portalLayout]);

  const activePortal = entering || arriving;

  const bubbleVisible = openingDone && !activePortal && (catHovered || chatPinned);

  // Decode before playback to avoid empty frames. Failed walking assets fall back
  // to the existing idle cat; no timeout reveals an unfinished opening.
  useEffect(() => {
    let cancelled = false;
    const pending = [];
    const load = src => new Promise(resolve => {
      const image = new Image();
      let finished = false;
      const finish = ok => {
        if (finished) return;
        finished = true;
        image.onload = null;
        image.onerror = null;
        resolve(ok);
      };
      pending.push(() => finish(false));
      image.onload = () => {
        if (image.decode) image.decode().then(() => finish(true), () => finish(true));
        else finish(true);
      };
      image.onerror = () => finish(false);
      image.src = src;
    });
    Promise.all([...WALK_FRAMES, ...CAT_FRAMES, catAngry].map(load)).then(results => {
      if (cancelled) return;
      setWalkingAvailable(results.slice(0, WALK_FRAMES.length).every(Boolean));
      setAngryReady(results[results.length - 1]);
      setAssetsReady(true);
    });
    return () => { cancelled = true; pending.forEach(cancel => cancel()); };
  }, []);

  // One owner for the intro, including its temporary iOS scroll lock.
  useLayoutEffect(() => {
    if (!assetsReady || !openingAllowed.current) return;
    const root = introRef.current;
    let alive = true;
    let released = false;
    let tl;
    const oldOverflow = document.body.style.overflow;
    const oldOverscroll = document.body.style.overscrollBehavior;
    const release = () => {
      if (released) return;
      released = true;
      document.body.style.overflow = oldOverflow;
      document.body.style.overscrollBehavior = oldOverscroll;
      window.removeEventListener("wheel", gesture);
      window.removeEventListener("touchmove", gesture);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", keySkip);
    };
    const ready = () => {
      release();
      if (alive) { setCatSettled(true); setOpeningDone(true); }
    };
    const skip = () => {
      release();
      // Seek over the remaining animation; a short fade softens the handoff.
      if (tl && tl.progress() < 1) {
        tl.progress(1);
        gsap.fromTo(root.querySelector(".meera-intro__content"), { opacity: 0.65 },
          { opacity: 1, duration: reducedMotion ? 0.1 : 0.18, overwrite: true });
      }
    };
    const gesture = event => { if (event.cancelable) event.preventDefault(); skip(); };
    const keySkip = event => { if ([" ", "ArrowDown", "PageDown", "End", "Escape"].includes(event.key)) skip(); };
    const ctx = gsap.context(() => {
      const letters = Array.from(root.querySelectorAll(".meera-intro__letter"));
      const cat = catRef.current;
      const walk = root.querySelector(".meera-intro__walking");
      const idle = root.querySelector(".meera-intro__idle");
      const action = actionRef.current;
      if (reducedMotion) {
        gsap.set(letters, { y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 });
        gsap.set(cat, { x: 0, opacity: 1, visibility: "visible" });
        gsap.set(walk, { opacity: 0 });
        gsap.set(idle, { opacity: 1 });
        gsap.set(action, { opacity: 1, y: 0, visibility: "visible" });
        ready();
        return;
      }
      const distance = -(window.innerWidth / 2 + cat.getBoundingClientRect().width);
      gsap.set(letters, { y: -window.innerHeight, opacity: 1, transformOrigin: "50% 95%" });
      gsap.set(cat, { x: distance, opacity: 1, visibility: "visible" });
      gsap.set(walk, { opacity: walkingAvailable ? 1 : 0 });
      gsap.set(idle, { opacity: walkingAvailable ? 0 : 1 });
      gsap.set(action, { opacity: 0, y: 14, visibility: "hidden" });
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
      window.addEventListener("wheel", gesture, { passive: false });
      window.addEventListener("touchmove", gesture, { passive: false });
      window.addEventListener("pointerdown", skip, { passive: true });
      window.addEventListener("keydown", keySkip);
      tl = gsap.timeline({ onComplete: ready });
      // Art-directed irregularity: repeatable on every render, each glyph has
      // its own release, lean and bounce. Shared final transforms lock layout.
      const personalities = [
        [0.04, -11, -16, 1.00, 1.18], [0.16, 7, 12, 0.91, 0.78],
        [0.00, -5, -8, 1.08, 1.02], [0.21, 13, 20, 0.94, 1.28],
        [0.07, -8, 10, 1.04, 0.87], [0.18, 5, -14, 0.93, 1.12],
        [0.02, 10, 16, 1.07, 0.76], [0.15, -13, -20, 0.95, 1.20],
        [0.05, 6, 8, 1.03, 0.94], [0.20, -7, -12, 0.92, 1.08],
        [0.01, 12, 18, 1.06, 1.25],
      ];
      letters.forEach((letter, index) => {
        const [delay, tilt, drift, fallSpeed, bounceSize] = personalities[index % personalities.length];
        const start = OPENING.beat + index * OPENING.letterGap + delay;
        const fall = OPENING.letterDrop * fallSpeed;
        const impact = start + fall;
        const rebound = Math.min(34, Math.max(10, letter.getBBox().height * 0.065)) * bounceSize;
        const up = OPENING.bounceUp * (0.94 + bounceSize * 0.12);
        const down = OPENING.bounceDown * (0.94 + bounceSize * 0.12);
        tl.fromTo(letter, { x: drift, rotation: tilt, scaleX: 1, scaleY: 1 }, {
          x: 0, y: 0, rotation: -tilt * 0.13,
          duration: fall, ease: "power2.in",
        }, start)
          .to(letter, { scaleX: 1.04, scaleY: 0.94,
            duration: 0.075, ease: "sine.out" }, impact)
          .to(letter, { y: -rebound, rotation: tilt * 0.17, scaleX: 0.985, scaleY: 1.025,
            duration: up, ease: "power2.out" }, impact + 0.045)
          .to(letter, { y: 0, rotation: -tilt * 0.045, scaleX: 1.014, scaleY: 0.98,
            duration: down, ease: "power2.in" }, impact + 0.045 + up)
          .to(letter, { y: -rebound * 0.12, rotation: 0, scaleX: 0.998, scaleY: 1.004,
            duration: 0.13, ease: "power2.out" }, impact + 0.045 + up + down)
          .to(letter, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0,
            duration: 0.23, ease: "sine.inOut" }, impact + 0.175 + up + down);
      });
      const walkStart = tl.duration() + OPENING.settle;
      // Frame clock lives in this timeline, so sprite playback stops on handoff.
      const clock = { time: 0 };
      if (walkingAvailable) {
        tl.to(clock, {
          time: OPENING.walk, duration: OPENING.walk, ease: "none",
          onUpdate: () => {
            if (alive) setWalkFrame(Math.floor(clock.time * 1000 / WALK_FRAME_MS) % WALK_FRAMES.length);
          },
        }, walkStart);
      }
      tl.to(cat, { x: 0, duration: OPENING.walk, ease: "sine.inOut" }, walkStart);
      const handoff = walkStart + OPENING.walk;
      tl.to(walk, { opacity: 0, duration: OPENING.handoff, ease: "sine.inOut" }, handoff)
        .to(idle, { opacity: 1, duration: OPENING.handoff, ease: "sine.inOut" }, handoff)
        .call(() => { if (alive) setCatSettled(true); }, [], handoff + OPENING.handoff)
        .set(action, { visibility: "visible" }, handoff + OPENING.handoff + 0.25)
        .to(action, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
        .call(ready);
    }, root);
    return () => { alive = false; release(); ctx.revert(); };
  }, [assetsReady, reducedMotion, walkingAvailable]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  const swapPose = next => {
    if (poseBusy.current || !angryReady || !openingDone || activePortal) return;
    window.clearTimeout(poseTimer.current);
    angryRef.current = next;
    setAngry(next);
    if (next) poseTimer.current = window.setTimeout(() => swapPose(false), CAT_POSE.returnAfter);
    if (reducedMotion) return;
    poseBusy.current = true;
    poseTimeline.current = gsap.timeline({ onComplete: () => { poseBusy.current = false; } })
      .to(catRef.current.querySelector(".meera-intro__cat-trigger"), { scaleX: 1.04, scaleY: 0.94, duration: 0.08 }, 0)
      .to(catRef.current.querySelector(".meera-intro__cat-trigger"), { scaleX: 0.98, scaleY: 1.04, rotation: -1.5, duration: 0.09 }, 0.08)
      .to(catRef.current.querySelector(".meera-intro__cat-trigger"), { scaleX: 1, scaleY: 1, rotation: 0, duration: CAT_POSE.duration - 0.17, ease: EASE.cat }, 0.17);
  };
  useEffect(() => () => {
    window.clearTimeout(poseTimer.current);
    poseTimeline.current?.kill();
  }, []);
  useEffect(() => {
    if (activePortal) {
      window.clearTimeout(poseTimer.current);
      poseTimeline.current?.kill();
      poseBusy.current = false;
    }
  }, [activePortal]);

  // Stop sprite playback when this hero or the browser tab is hidden.
  useEffect(() => {
    let visible = true;
    const update = () => setLoopVisible(visible && !document.hidden);
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      update();
    });
    observer.observe(introRef.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  // Escape dismisses the hover / keyboard speech bubble. Cat clicks keep the angry pose toggle.
  useEffect(() => {
    if (!bubbleVisible) return;
    const dismiss = event => {
      if (event.key === "Escape") { setChatPinned(false); setCatHovered(false); }
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [bubbleVisible]);

  // Lock measurements at click-time. The eye rests exactly at the viewport centre.
  useLayoutEffect(() => {
    if (!entering || portalLayout || !actionRef.current) return;
    const rect = actionRef.current.getBoundingClientRect();
    const size = rect.width;
    setPortalLayout({
      size,
      fromX: rect.left,
      fromY: rect.top + size * (PAW_OFFSET_Y / 128),
      toX: window.innerWidth / 2 - size / 2,
      toY: window.innerHeight / 2 - size * (EYE_CENTER_Y / 128),
      eyeX: window.innerWidth / 2,
      eyeY: window.innerHeight / 2,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }, [entering, portalLayout]);

  useLayoutEffect(() => {
    if (!entering || !portalLayout || !hypnosisRef.current || reducedMotion) return;
    const layer = hypnosisRef.current;
    const paw = layer.querySelector(".meera-portal__paw");
    const eyelid = layer.querySelector(".meera-portal__eye-opening");
    const coverHole = layer.querySelector(".meera-portal__cover-hole");
    const tunnel = layer.querySelector(".meera-hypnosis__tunnel");
    const blackRibbon = layer.querySelector(".meera-hypnosis__black-ribbon");
    const yellowRibbon = layer.querySelector(".meera-hypnosis__yellow-ribbon");
    const core = layer.querySelector(".meera-hypnosis__core");
    const { size, fromX, fromY, toX, toY } = portalLayout;
    const pupilRadius = size * (EYE_PUPIL_RADIUS / 128);

    const ctx = gsap.context(() => {
      gsap.set(paw, { x: fromX, y: fromY, width: size, height: size, opacity: 1 });
      // Clip opens symmetrically through the pad; the eye never translates.
      gsap.set(eyelid, { attr: { r: 0 } });
      gsap.set(coverHole, { attr: { r: 0 } });
      const geometry = spiralGeometry;
      const draw = { progress: 0 };
      let drawnIndex = -1;
      const updateSpiral = () => {
        const progress = Math.max(0, Math.min(1, draw.progress));
        const visible = progress > 0.0001;
        gsap.set(tunnel, { visibility: visible ? "visible" : "hidden" });
        // Cut the paw away from the centre only as the progressing spiral grows.
        // The paw stays fully opaque: no fade or visible jump. Reversing the same
        // draw.progress automatically restores it from the outside inward.
        const maxHole = Math.hypot(128, 128);
        const spiralReach = geometry.startRadius *
          Math.pow(HYPNOSIS_GROWTH, (geometry.points.length - 1) * progress / HYPNOSIS_SAMPLES_PER_TURN);
        const holeInSvg = Math.max(0, (spiralReach / size) * 128 - EYE_PUPIL_RADIUS);
        coverHole.setAttribute("r", String(Math.min(maxHole, holeInSvg)));
        if (!visible) return;
        const index = Math.ceil(progress * (geometry.points.length - 1));
        if (index !== drawnIndex) {
          blackRibbon.setAttribute("d", ribbonAt(geometry.points, progress, "middle", "outer"));
          yellowRibbon.setAttribute("d", ribbonAt(geometry.points, progress, "inner", "middle"));
          drawnIndex = index;
        }
      };
      gsap.set(tunnel, { rotation: 0, svgOrigin: `${portalLayout.eyeX} ${portalLayout.eyeY}`, visibility: "hidden" });
      gsap.set(core, { attr: { r: geometry.startRadius * 1.6 } });
      updateSpiral();

      const tl = gsap.timeline({ paused: true });
        // 1. Paw lands with its eye precisely at viewport centre.
        tl.to(paw, {
          x: toX, y: toY - size * 0.14,
          duration: 0.58, ease: "power2.inOut",
        }, 0)
          .to(paw, { y: toY, duration: 0.36, ease: "back.out(1.45)" }, 0.58)
          .to(eyelid, { attr: { r: EYE_IRIS_RADIUS }, duration: EYE_OPEN_DURATION, ease: "power3.inOut" }, 0.92);

        // 2. Draw BOTH ribbons, tip-first, along the true logarithmic spiral.
        // Nothing is unveiled with a circular mask.
        const expandStart = 1.72;
        tl.to(draw, {
          progress: 1,
          duration: HYPNOSIS_DURATION,
          ease: "sine.inOut",
          onUpdate: updateSpiral,
        }, expandStart)
          .to(tunnel, {
            rotation: HYPNOSIS_ROTATION,
            duration: HYPNOSIS_DURATION,
            ease: "sine.inOut",
          }, expandStart);
        // Paw stays fully opaque and is covered by the progressing spiral.

        // The complete two-colour spiral itself holds the viewport during scene
        // switching. No black finish overlay is faded in or out.
        const forwardEnd = expandStart + HYPNOSIS_DURATION;
        tl.call(() => portalCallbacks.current.onPortalReached?.(), [], forwardEnd)
          .addPause(forwardEnd);

        // 3. Retrace the very SAME drawn ribbons backwards, with symmetric ease.
        const reverseStart = forwardEnd + 0.02;
        tl.to(draw, {
          progress: 0,
          duration: HYPNOSIS_DURATION,
          ease: "sine.inOut",
          onUpdate: updateSpiral,
        }, reverseStart)
          .to(tunnel, {
            rotation: 0,
            duration: HYPNOSIS_DURATION,
            ease: "sine.inOut",
          }, reverseStart);

        const reverseEnd = reverseStart + HYPNOSIS_DURATION;
        // The returning spiral reveals the original, stationary paw underneath.
        // After the spiral has fully returned into the pupil, blink the eye shut.
        tl.to(eyelid, { attr: { r: 0 }, duration: 0.58, ease: "power3.inOut" }, reverseEnd + 0.04)
          .to(paw, { opacity: 0, scale: 0.9, duration: 0.38, ease: "power2.in" }, reverseEnd + 0.61)
          .call(() => portalCallbacks.current.onTransitionComplete?.(), [], reverseEnd + 1.02);
      portalTimelineRef.current = tl;
      tl.play();
    }, layer);
    return () => {
      portalTimelineRef.current = null;
      ctx.revert();
    };
  }, [entering, portalLayout, reducedMotion]);

  // The parent changes the underlying scene only at full cover; resume after commit.
  useLayoutEffect(() => {
    if (arriving && !reducedMotion) portalTimelineRef.current?.play();
  }, [arriving, reducedMotion]);

  useEffect(() => {
    if (!activePortal || !reducedMotion) return;
    const frame = window.requestAnimationFrame(() => {
      if (arriving) portalCallbacks.current.onTransitionComplete?.();
      else portalCallbacks.current.onPortalReached?.();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activePortal, arriving, reducedMotion]);

  /* =========================================
     TYPEWRITER
  ========================================= */

  useEffect(() => {
    if (!bubbleVisible) return;
    setStage("typing");
    setTypedCount(0);
    const full = PREFIX + ORIGINAL;
    if (reducedMotion) {
      setTypedCount(full.length);
      setStage("done");
      return;
    }
    let count = 0;

    const interval = window.setInterval(() => {
      count += 1;
      setTypedCount(count);

      if (count >= full.length) {
        window.clearInterval(interval);
        setStage("pause");
      }
    }, 65);

    return () => window.clearInterval(interval);
  }, [reducedMotion, bubbleVisible]);

  /* =========================================
     PAUSE BEFORE CORRECTION
  ========================================= */

  useEffect(() => {
    if (!bubbleVisible || stage !== "pause") return;

    const timer = window.setTimeout(() => {
      setStage("strike");
    }, 450);

    return () => window.clearTimeout(timer);
  }, [stage, bubbleVisible]);

  /* =========================================
     STRIKE THROUGH "FORTUNE"
  ========================================= */

  useEffect(() => {
    if (!bubbleVisible || stage !== "strike") return;

    const timer = window.setTimeout(() => {
      setStage("replace");
    }, 650);

    return () => window.clearTimeout(timer);
  }, [stage, bubbleVisible]);

  /* =========================================
     REPLACE WITH "PURRTUNE!"
  ========================================= */

  useEffect(() => {
    if (!bubbleVisible || stage !== "replace") return;

    const timer = window.setTimeout(() => {
      setStage("done");
    }, 800);

    return () => window.clearTimeout(timer);
  }, [stage, bubbleVisible]);

  /* =========================================
     CAT SPRITE ANIMATION
  ========================================= */

  useEffect(() => {
    if (activePortal || reducedMotion || !catSettled || !loopVisible || angry) return;
    const interval = window.setInterval(() => {
      setCatFrame(
        (previous) => (previous + 1) % CAT_FRAMES.length
      );
    }, 200);

    return () => window.clearInterval(interval);
  }, [activePortal, reducedMotion, catSettled, loopVisible, angry]);

  /* =========================================
     TEXT VISIBILITY
  ========================================= */

  const full = PREFIX + ORIGINAL;

  const visiblePrefix = full.slice(
    0,
    Math.min(typedCount, PREFIX.length)
  );

  const visibleOriginal = full.slice(
    PREFIX.length,
    typedCount
  );

  const showReplacement =
    stage === "replace" || stage === "done";

  /* =========================================
     RENDER
  ========================================= */

  return (
    <section
      ref={introRef}
      className={`meera-intro${
        activePortal ? " is-entering" : ""}${reducedMotion ? " is-reduced-motion" : ""}${arriving ? " is-arriving" : ""
      }`}
      aria-labelledby="intro-title"
    >
      <PurrHeader visible={openingDone && !activePortal} />
      <h1 id="intro-title" className="meera-intro__sr-only">Purranormal</h1>
      <div className="meera-intro__content">
        <div className="meera-intro__wordmark" aria-hidden="true">
          <TitleLine from={0} to={4} viewBox="0 0 522.162 353.96" className="meera-intro__wordmark-purr" />
          <TitleLine from={4} to={11} viewBox="522.162 0 1004.798 353.96" className="meera-intro__wordmark-anormal" />
        </div>

        <div className="meera-intro__cat" ref={catRef}>
          <button
            className="meera-intro__cat-trigger"
            type="button"
            disabled={!openingDone || activePortal}
            aria-label="Make the cat angry"
            aria-pressed={angry}
            aria-describedby={bubbleVisible ? "lucifur-speech" : undefined}
            onPointerEnter={event => { if (event.pointerType !== "touch") setCatHovered(true); }}
            onPointerLeave={() => { setCatHovered(false); pointerStart.current = null; }}
            onFocus={event => { if (event.currentTarget.matches(":focus-visible")) setCatHovered(true); }}
            onBlur={() => setCatHovered(false)}
            onPointerDown={event => {
              pointerStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: window.scrollY, moved: false };
            }}
            onPointerMove={event => {
              const p = pointerStart.current;
              if (p && Math.hypot(event.clientX - p.x, event.clientY - p.y) > 10) p.moved = true;
            }}
            onPointerCancel={() => { pointerStart.current = null; }}
            onPointerUp={event => {
              const p = pointerStart.current;
              pointerStart.current = null;
              if (p && p.id === event.pointerId && !p.moved && Math.abs((window.scrollY) - p.scroll) < 10 &&
                Math.hypot(event.clientX - p.x, event.clientY - p.y) <= 10) swapPose(!angryRef.current);
            }}
            onClick={event => { if (event.detail === 0) swapPose(!angryRef.current); }}
          >
            <img className="meera-intro__walking" src={WALK_FRAMES[walkFrame]} alt="" draggable={false} />
            <img className="meera-intro__idle" src={angry ? catAngry : CAT_FRAMES[catFrame]} alt="" draggable={false} />
          </button>
          <div id="lucifur-speech" className="meera-intro__speech" hidden={!bubbleVisible}>
            <span className="meera-intro__sr-only">{MESSAGE}</span>
            <p aria-hidden="true">
              {visiblePrefix}
              {visibleOriginal && (
                <span className={`meera-intro__correction${stage === "strike" || showReplacement ? " is-struck" : ""}`}>
                  {visibleOriginal}
                </span>
              )}
              {showReplacement && <span className="meera-intro__replacement">{REPLACEMENT}</span>}
              {!showReplacement && <span className="meera-intro__cursor" />}
            </p>
          </div>
        </div>

        {/* MORPH BUTTON — BOTTOM */}
        <div className="meera-intro__action" ref={actionRef}>
          <MorphButton
            variant="solid"
            color="#000000"
            textColor="#ffffff"
            duration={0.55}
            reducedMotion={reducedMotion}
            onClick={() => { if (openingDone && !activePortal) onBegin?.(); }}
            disabled={!openingDone || activePortal}
            aria-label="Let's Paw!"
          >
            Let's Paw!
          </MorphButton>
        </div>
      </div>

      {activePortal && portalLayout && (
        <div className="meera-intro__transition" ref={hypnosisRef} aria-hidden="true">
          <div className="meera-portal__coordinates" style={{ width: portalLayout.viewportWidth, height: portalLayout.viewportHeight }}>
          <div className="meera-portal__paw">
            <svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true">
              <defs>
                {/* Eye opening is circular, not an elliptical slit. */}
                <clipPath id="meera-paw-eye-clip">
                  <circle className="meera-portal__eye-opening" cx={EYE_CENTER_X} cy={EYE_CENTER_Y} r="0" />
                </clipPath>
                {/* The spiral cuts through the paw. No opacity blink during expansion/reverse. */}
                <mask id="meera-paw-cover-mask" maskUnits="userSpaceOnUse" x="-128" y="-128" width="384" height="384">
                  <rect x="-128" y="-128" width="384" height="384" fill="white" />
                  <circle className="meera-portal__cover-hole" cx={EYE_CENTER_X} cy={EYE_CENTER_Y} r="0" fill="black" />
                </mask>
              </defs>
              <g mask="url(#meera-paw-cover-mask)">
              <g fill="#000">
                <path d="M96.46,89.97c0,16.88-13.42,23.56-31.35,23.56s-33.58-6.67-33.58-23.56,14.53-36.71,32.46-36.71,32.46,19.83,32.46,36.71Z" />
                <path d="M79.07,14.51c8.19-.74,14.78,9.37,15.44,16.66.83,9.23-4.42,20.57-15.19,19.41-16.06-1.72-16.22-34.63-.25-36.07Z" />
                <ellipse cx="104.82" cy="59.09" rx="12.87" ry="16.75" transform="rotate(-3.77 104.82 59.09)" />
                <path d="M48.93,14.51c-8.19-.74-14.78,9.37-15.44,16.66-.83,9.23,4.42,20.57,15.19,19.41,16.06-1.72,16.22-34.63.25-36.07Z" />
                <ellipse cx="23.18" cy="59.09" rx="12.87" ry="16.75" transform="rotate(3.77 23.18 59.09)" />
              </g>
                <g className="meera-portal__eye" clipPath="url(#meera-paw-eye-clip)">
                  <circle cx={EYE_CENTER_X} cy={EYE_CENTER_Y} r={EYE_IRIS_RADIUS} fill="#fccd4b" />
                  <circle cx={EYE_CENTER_X} cy={EYE_CENTER_Y} r={EYE_PUPIL_RADIUS} fill="#000000" />
                </g>
              </g>
            </svg>
          </div>
          <svg className="meera-hypnosis__svg" viewBox={`0 0 ${portalLayout.viewportWidth} ${portalLayout.viewportHeight}`} preserveAspectRatio="none" aria-hidden="true">
            <g className="meera-hypnosis__tunnel">
              <circle className="meera-hypnosis__core" cx={portalLayout.eyeX} cy={portalLayout.eyeY} r="0" fill="#000000" />
              <path className="meera-hypnosis__black-ribbon" fill="#000000" />
              <path className="meera-hypnosis__yellow-ribbon" fill="#fccd4b" />
            </g>
          </svg>
          </div>
        </div>
      )}
    </section>
  );
}