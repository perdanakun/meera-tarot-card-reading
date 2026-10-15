
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./IntroScene.css";
import MorphButton from "./ui/MorphButton/MorphButton";

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

// Each closed ring originates at the exact centre of the pupil.
// Unlike SVG dash drawing, a closed circle has no visible seam or starting endpoint.
const HYPNOSIS_RING_COUNT = 20;
const HYPNOSIS_GROWTH = 1.43;
const HYPNOSIS_STAGGER = 0.205;

export default function IntroScene({
  entering = false,
  arriving = false,
  onBegin,
  onPortalReached,
  onTransitionComplete,
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
  const rings = portalLayout
    ? Array.from({ length: HYPNOSIS_RING_COUNT }, (_, index) => {
        const pupilRadius = portalLayout.size * (6.5 / 128);
        const radius = pupilRadius * Math.pow(HYPNOSIS_GROWTH, index + 1);
        return {
          radius,
          width: Math.max(2, radius * 0.43),
          color: index % 2 === 0 ? "#fccd4b" : "#000000",
        };
      })
    : [];

  const activePortal = entering || arriving;

  // Lock measurements at click-time. The eye rests exactly at the viewport centre.
  useLayoutEffect(() => {
    if (!entering || portalLayout || !actionRef.current) return;
    const rect = actionRef.current.getBoundingClientRect();
    const size = rect.width;
    setPortalLayout({
      size,
      fromX: rect.left,
      fromY: rect.top,
      toX: window.innerWidth / 2 - size / 2,
      toY: window.innerHeight / 2 - size * (82 / 128),
      eyeX: window.innerWidth / 2,
      eyeY: window.innerHeight / 2,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }, [entering, portalLayout]);

  useLayoutEffect(() => {
    if (!entering || !portalLayout || !hypnosisRef.current) return;
    const layer = hypnosisRef.current;
    const paw = layer.querySelector(".meera-portal__paw");
    const eyelid = layer.querySelector(".meera-portal__eye-opening");
    const tunnel = layer.querySelector(".meera-hypnosis__tunnel");
    const circles = Array.from(layer.querySelectorAll(".meera-hypnosis__ring"));
    const backdrop = layer.querySelector(".meera-hypnosis__backdrop");
    const finish = layer.querySelector(".meera-hypnosis__finish");
    const { size, fromX, fromY, toX, toY } = portalLayout;
    const pupilRadius = size * (6.5 / 128);
    const lastRadius = rings[rings.length - 1].radius + rings[rings.length - 1].width;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.set(paw, { x: fromX, y: fromY, width: size, height: size, opacity: 1 });
      // Clip opens symmetrically through the pad; the eye never translates.
      gsap.set(eyelid, { attr: { y: 82, height: 0 } });
      gsap.set(tunnel, { opacity: 1 });
      gsap.set(backdrop, { attr: { r: pupilRadius } });
      circles.forEach((circle) => {
        gsap.set(circle, { attr: { r: pupilRadius, "stroke-width": 0.6 }, opacity: 0 });
      });
      gsap.set(finish, { opacity: 0 });

      const tl = gsap.timeline({ paused: true });
      if (reduced) {
        tl.set(finish, { opacity: 1 })
          .call(() => portalCallbacks.current.onPortalReached?.())
          .addPause("portal")
          .set(finish, { opacity: 0 })
          .call(() => portalCallbacks.current.onTransitionComplete?.());
      } else {
        // 1. Paw lands in the viewport centre.
        tl.to(paw, {
          x: toX, y: toY - size * 0.14,
          duration: 0.58, ease: "power2.inOut",
        }, 0)
          .to(paw, { y: toY, duration: 0.36, ease: "back.out(1.45)" }, 0.58)
          // 2. A slit opens INSIDE the paw pad, revealing a stationary eye.
          .to(eyelid, { attr: { y: 70, height: 24 }, duration: 0.72, ease: "power3.inOut" }, 0.92)
          // Rings rise radially from the same black pupil, one after another.
          // Their closed outlines avoid the visible start/end seam of stroke dashes.
          .to(paw, { opacity: 0, duration: 0.65, ease: "sine.inOut" }, 2.08);

        const ringStart = 1.7;
        circles.forEach((circle, index) => {
          const ring = rings[index];
          const at = ringStart + index * HYPNOSIS_STAGGER;
          tl.to(backdrop, {
            attr: { r: ring.radius + ring.width * 0.55 },
            duration: 0.9,
            ease: "sine.inOut",
          }, at);
          tl.set(circle, { opacity: 1 }, at);
          tl.to(circle, {
            attr: { r: ring.radius, "stroke-width": ring.width },
            duration: 1.1,
            ease: "power2.out",
          }, at);
        });

        const forwardEnd = ringStart + (circles.length - 1) * HYPNOSIS_STAGGER + 1.12;
        tl.to(backdrop, { attr: { r: lastRadius }, duration: 0.3 }, forwardEnd - 0.4)
          .to(finish, { opacity: 1, duration: 0.25, ease: "sine.inOut" }, forwardEnd - 0.1)
          .call(() => portalCallbacks.current.onPortalReached?.(), [], forwardEnd + 0.17)
          .addPause("portal", forwardEnd + 0.17);

        // Reverse the expanding layers: farthest ring closes first,
        // everything returns to the SAME pupil position.
        const reverseStart = forwardEnd + 0.3;
        tl.to(finish, { opacity: 0, duration: 0.28, ease: "sine.inOut" }, reverseStart);
        [...circles].reverse().forEach((circle, reversedIndex) => {
          const index = circles.length - 1 - reversedIndex;
          const at = reverseStart + 0.08 + reversedIndex * 0.105;
          tl.to(circle, {
            attr: { r: pupilRadius, "stroke-width": 0.6 },
            duration: 0.7,
            ease: "power2.inOut",
          }, at);
          tl.to(backdrop, {
            attr: { r: index === 0 ? pupilRadius : rings[index - 1].radius + rings[index - 1].width * 0.55 },
            duration: 0.44,
            ease: "sine.inOut",
          }, at);
        });
        const reverseEnd = reverseStart + 0.08 + (circles.length - 1) * 0.105 + 0.72;
        tl.set(paw, { x: toX, y: toY, scale: 1, opacity: 1 }, reverseEnd - 0.36)
          .to(eyelid, { attr: { y: 82, height: 0 }, duration: 0.58, ease: "power3.inOut" }, reverseEnd)
          .to(paw, { opacity: 0, scale: 0.9, duration: 0.38, ease: "power2.in" }, reverseEnd + 0.57)
          .call(() => portalCallbacks.current.onTransitionComplete?.(), [], reverseEnd + 0.98);
      }
      portalTimelineRef.current = tl;
      tl.play();
    }, layer);
    return () => {
      portalTimelineRef.current = null;
      ctx.revert();
    };
  }, [entering, portalLayout]);

  // The parent changes the underlying scene only at full cover; resume after commit.
  useLayoutEffect(() => {
    if (arriving) portalTimelineRef.current?.play();
  }, [arriving]);

  /* =========================================
     TYPEWRITER
  ========================================= */

  useEffect(() => {
    const full = PREFIX + ORIGINAL;
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
  }, []);

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
    if (activePortal) return; // Freeze sprite during the portal.
    const interval = window.setInterval(() => {
      setCatFrame(
        (previous) => (previous + 1) % CAT_FRAMES.length
      );
    }, 200);

    return () => window.clearInterval(interval);
  }, [activePortal]);

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
      <main className="meera-intro__content">

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
            onClick={onBegin}
            disabled={entering}
            aria-label="Let's Paw!"
          >
            Let's Paw!
          </MorphButton>
        </div>
      </main>

      {activePortal && portalLayout && (
        <div className="meera-intro__transition" ref={hypnosisRef} aria-hidden="true">
          <div className="meera-portal__paw">
            <svg viewBox="0 0 128 128" width="100%" height="100%" aria-hidden="true">
              <g fill="#000">
                <path d="M96.46,89.97c0,16.88-13.42,23.56-31.35,23.56s-33.58-6.67-33.58-23.56,14.53-36.71,32.46-36.71,32.46,19.83,32.46,36.71Z" />
                <path d="M79.07,14.51c8.19-.74,14.78,9.37,15.44,16.66.83,9.23-4.42,20.57-15.19,19.41-16.06-1.72-16.22-34.63-.25-36.07Z" />
                <ellipse cx="104.82" cy="59.09" rx="12.87" ry="16.75" transform="rotate(-3.77 104.82 59.09)" />
                <path d="M48.93,14.51c-8.19-.74-14.78,9.37-15.44,16.66-.83,9.23,4.42,20.57,15.19,19.41,16.06-1.72,16.22-34.63.25-36.07Z" />
                <ellipse cx="23.18" cy="59.09" rx="12.87" ry="16.75" transform="rotate(3.77 23.18 59.09)" />
              </g>
              <defs>
                <clipPath id="meera-paw-eye-clip">
                  <rect className="meera-portal__eye-opening" x="45" y="82" width="38" height="0" />
                </clipPath>
              </defs>
              <g className="meera-portal__eye" clipPath="url(#meera-paw-eye-clip)">
                <ellipse cx="64" cy="82" rx="18" ry="12" fill="#ffcf4d" />
                <ellipse cx="64" cy="82" rx="6.5" ry="11" fill="#000" />
                <circle cx="61" cy="78" r="2.2" fill="#fff" />
              </g>
            </svg>
          </div>
          <svg className="meera-hypnosis__svg" viewBox={`0 0 ${portalLayout.viewportWidth} ${portalLayout.viewportHeight}`} preserveAspectRatio="none" aria-hidden="true">
            <g className="meera-hypnosis__tunnel">
              <circle className="meera-hypnosis__backdrop" cx={portalLayout.eyeX} cy={portalLayout.eyeY} r="0" fill="#000000" />
              {rings.map((ring, index) => (
                <circle
                  key={index}
                  className="meera-hypnosis__ring"
                  cx={portalLayout.eyeX}
                  cy={portalLayout.eyeY}
                  r="0"
                  fill="none"
                  stroke={ring.color}
                  strokeWidth="0.6"
                  strokeLinecap="round"
                />
              ))}
            </g>
          </svg>
          <div className="meera-hypnosis__finish" />
        </div>
      )}
    </section>
  );
}