
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import "./IntroScene.css";
import MorphButton, { PAW_OFFSET_Y } from "./ui/MorphButton/MorphButton";

import catFrame1 from "../assets/background/cat_hero-01.svg";
import catFrame2 from "../assets/background/cat_hero-02.svg";
import catFrame3 from "../assets/background/cat_hero-03.svg";
import catFrame4 from "../assets/background/cat_hero-04-04.svg";

/* =========================================
   BACKGROUND CONFIG
   "solid" = design-system background
   "image" = Image from assets/background
========================================= */

const BACKGROUND_MODE = "solid";

/* =========================================
   CONTENT
========================================= */

const PREFIX =
  "im lucifur son of the darkness and i will tell your ";

const ORIGINAL = "fortune";
const REPLACEMENT = "purrtune!";
const MESSAGE = `${PREFIX}${REPLACEMENT}`;
const BRAND = "Purranormal";

const CAT_FRAMES = [
  catFrame1,
  catFrame2,
  catFrame3,
  catFrame4,
];

// A pair of interlocking ribbons is drawn along the spiral itself.
// No circular reveal, no stroke-dash endpoint, and no solid-black handoff frame.
const HYPNOSIS_GROWTH = 1.43; // Radius multiplier per complete revolution.
const HYPNOSIS_DURATION = 4.6; // Same duration in both directions.
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
  reducedMotion = false,
}) {
  const [stage, setStage] = useState("typing");
  const [typedCount, setTypedCount] = useState(0);
  const [catFrame, setCatFrame] = useState(0);
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
    const full = PREFIX + ORIGINAL;
    if (reducedMotion) {
      setTypedCount(full.length);
      setStage("done");
      return;
    }
    if (stage === "done") return;
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
  }, [reducedMotion]);

  /* =========================================
     PAUSE BEFORE CORRECTION
  ========================================= */

  useEffect(() => {
    if (stage !== "pause") return;

    const timer = window.setTimeout(() => {
      setStage("strike");
    }, 450);

    return () => window.clearTimeout(timer);
  }, [stage]);

  /* =========================================
     STRIKE THROUGH "FORTUNE"
  ========================================= */

  useEffect(() => {
    if (stage !== "strike") return;

    const timer = window.setTimeout(() => {
      setStage("replace");
    }, 650);

    return () => window.clearTimeout(timer);
  }, [stage]);

  /* =========================================
     REPLACE WITH "PURRTUNE!"
  ========================================= */

  useEffect(() => {
    if (stage !== "replace") return;

    const timer = window.setTimeout(() => {
      setStage("done");
    }, 800);

    return () => window.clearTimeout(timer);
  }, [stage]);

  /* =========================================
     CAT SPRITE ANIMATION
  ========================================= */

  useEffect(() => {
    if (activePortal || reducedMotion) return;
    const interval = window.setInterval(() => {
      setCatFrame(
        (previous) => (previous + 1) % CAT_FRAMES.length
      );
    }, 200);

    return () => window.clearInterval(interval);
  }, [activePortal, reducedMotion]);

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
        activePortal ? " is-entering" : ""}${arriving ? " is-arriving" : ""
      }`}
      data-background={BACKGROUND_MODE}
      aria-labelledby="intro-title"
    >
      {/* BRAND — TOP */}
      <div
        className="meera-intro__brand"
        role="img"
        aria-label={BRAND}
      >
        {Array.from(BRAND).map((letter, index) => (
          <span
            key={index}
            className={
              letter === " "
                ? "meera-intro__brand-space"
                : "meera-intro__brand-letter"
            }
            style={{ "--letter-index": index }}
            aria-hidden="true"
          >
            {letter === " " ? "\u00a0" : letter}
          </span>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="meera-intro__content">

        {/* CAT — FIXED VISUAL ANCHOR */}
        <div
          className="meera-intro__cat"
          ref={catRef}
          aria-hidden="true"
        >
          <img
            src={CAT_FRAMES[catFrame]}
            alt=""
            draggable={false}
          />
        </div>

        {/* TITLE — GROWS DOWNWARD */}
        <div className="meera-intro__title-area">
          <h1
            id="intro-title"
            className="meera-intro__title"
            aria-label={MESSAGE}
          >
            <span aria-hidden="true">
              {visiblePrefix}
            </span>

            {visibleOriginal && (
              <span
                className={`meera-intro__correction${
                  stage === "strike" ||
                  showReplacement
                    ? " is-struck"
                    : ""
                }`}
                aria-hidden="true"
              >
                {visibleOriginal}
              </span>
            )}

            {showReplacement && (
              <span
                className="meera-intro__replacement"
                aria-hidden="true"
              >
                {REPLACEMENT}
              </span>
            )}

            {!showReplacement && (
              <span
                className="meera-intro__cursor"
                aria-hidden="true"
              />
            )}
          </h1>
        </div>

        {/* MORPH BUTTON — BOTTOM */}
        <div className="meera-intro__action" ref={actionRef}>
          <MorphButton
            variant="solid"
            color="#000000"
            textColor="#ffffff"
            duration={0.55}
            reducedMotion={reducedMotion}
            onClick={onBegin}
            disabled={entering}
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
