import { useId, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import "./MorphButton.css";

gsap.registerPlugin(MorphSVGPlugin);

// One continuous main shape: button -> circle -> original paw pad.
const BUTTON = "M18.8 44.22 H109.2 Q121.42 44.22 121.42 56.44 V71.57 Q121.42 83.79 109.2 83.79 H18.8 Q6.58 83.79 6.58 71.57 V56.44 Q6.58 44.22 18.8 44.22 Z";
const CIRCLE = "M64 42 C76.15 42 86 51.85 86 64 C86 76.15 76.15 86 64 86 C51.85 86 42 76.15 42 64 C42 51.85 51.85 42 64 42 Z";
const PAW_PAD = "M96.46,89.97c0,16.88-13.42,23.56-31.35,23.56s-33.58-6.67-33.58-23.56,14.53-36.71,32.46-36.71,32.46,19.83,32.46,36.71Z";

/* =========================================
   SHARED BOTTOM BASELINE
========================================= */

const BUTTON_BOTTOM = 83.79;
const CIRCLE_BOTTOM = 86;
const PAW_BOTTOM = 113.53;

// Offset dihitung dari batas bawah button
const CIRCLE_OFFSET_Y = BUTTON_BOTTOM - CIRCLE_BOTTOM;
export const PAW_OFFSET_Y = BUTTON_BOTTOM - PAW_BOTTOM;

// Edit these fractions to tune the flow. Values refer to total duration.
const PHASE = {
  circleEnd: 0.36,
  circleHoldEnd: 0.47,
  padEnd: 0.76,
  toesStart: 0.72,
  toesEnd: 1.0,
};

export default function MorphButton({
  children = "Let's Paw!",
  variant = "solid",
  color = "#000000",
  textColor = "#ffffff",
  duration = 1.05,
  onClick,
  disabled = false,
  reducedMotion = false,
  className = "",
  type = "button",
  ...rest
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const buttonRef = useRef(null);
  const timelineRef = useRef(null);
  const clickTweenRef = useRef(null);
  const pressRef = useRef(null);
  const busyRef = useRef(false);
  const reducedRef = useRef(false);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  reducedRef.current = reducedMotion;

  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const main = button.querySelector("[data-main]");
    const label = button.querySelector("[data-label]");
    const toes = Array.from(button.querySelectorAll("[data-toe]"));
    const shape = button.querySelector("[data-shape]");
    const d = Math.max(0.25, duration);

    const ctx = gsap.context(() => {
      gsap.set(main, { attr: { d: BUTTON } });
      gsap.set(label, { opacity: 1, scale: 1, svgOrigin: "64 64" });
gsap.set(shape, {
  scale: 1,
  y: 0,
  svgOrigin: "64 64",
});

      // Toe geometry is the original paw asset. Initially each toe is
      // collapsed into the center of the MAIN pad (64, 88), not below it.
      // Visibility prevents ghost blobs during button -> circle.
      const centers = [
        { x: 79, y: 33 },
        { x: 104.82, y: 59.09 },
        { x: 49, y: 33 },
        { x: 23.18, y: 59.09 },
      ];
      toes.forEach((toe, i) => {
        const { x, y } = centers[i];
        gsap.set(toe, {
          x: 64 - x,
          y: 88 - y,
          scale: 0.06,
          svgOrigin: `${x} ${y}`,
          visibility: "hidden",
        });
      });

      const tl = gsap.timeline({ paused: true });

/* =====================================
   PHASE 1
   BUTTON → CIRCLE
   Bottom edge stays aligned
===================================== */

tl.to(
  label,
  {
    opacity: 0,
    scale: 0.88,
    duration: d * 0.18,
    ease: "power1.out",
  },
  0
);

tl.to(
  main,
  {
    morphSVG: {
      shape: CIRCLE,
      shapeIndex: "auto",
    },
    duration: d * PHASE.circleEnd,
    ease: "power2.inOut",
  },
  0
);

/* Align circle bottom to button bottom */

tl.to(
  shape,
  {
    y: CIRCLE_OFFSET_Y,
    duration: d * PHASE.circleEnd,
    ease: "power2.inOut",
  },
  0
);

/* =====================================
   PHASE 2
   CIRCLE → PAW PAD
   Bottom edge stays aligned
===================================== */

tl.to(
  main,
  {
    morphSVG: {
      shape: PAW_PAD,
      shapeIndex: "auto",
    },
    duration:
      d * (PHASE.padEnd - PHASE.circleHoldEnd),
    ease: "power2.inOut",
  },
  d * PHASE.circleHoldEnd
);

/* Move the paw upward to preserve baseline */

tl.to(
  shape,
  {
    y: PAW_OFFSET_Y,
    duration:
      d * (PHASE.padEnd - PHASE.circleHoldEnd),
    ease: "power2.inOut",
  },
  d * PHASE.circleHoldEnd
);

      // 3. Only after the main pad is mostly formed, the four toes spread.
      tl.set(toes, { visibility: "visible" }, d * PHASE.toesStart);
      tl.to(toes, {
        x: 0,
        y: 0,
        scale: 1,
        duration: d * (PHASE.toesEnd - PHASE.toesStart),
        stagger: { each: d * 0.012, from: "center" },
        ease: "power2.out",
      }, d * PHASE.toesStart);

      timelineRef.current = tl;
    }, button);

    return () => {
      clickTweenRef.current?.kill();
      pressRef.current?.kill();
      timelineRef.current = null;
      busyRef.current = false;
      ctx.revert();
    };
  }, [duration]);

  useLayoutEffect(() => {
    if (!reducedMotion || !timelineRef.current) return;
    if (busyRef.current) {
      clickTweenRef.current?.progress(1);
      pressRef.current?.progress(1);
    } else {
      const active = buttonRef.current?.matches(":hover, :focus-visible");
      timelineRef.current.progress(active ? 1 : 0).pause();
    }
  }, [reducedMotion]);

  function handleEnter() {
    // Game menu keeps its label readable while selected; morph only on activation.
    if (variant === "game") return;
    if (disabled || busyRef.current) return;
    if (reducedRef.current) timelineRef.current?.progress(1).pause();
    else timelineRef.current?.play();
  }
  function handleLeave() {
    if (busyRef.current) return;
    if (reducedRef.current) timelineRef.current?.progress(0).pause();
    else timelineRef.current?.reverse();
  }
  function handleClick(event) {
    if (disabled || busyRef.current) return;
    const tl = timelineRef.current;
    const button = buttonRef.current;
    const shape = button?.querySelector("[data-shape]");
    if (!tl || !shape) return onClickRef.current?.(event);
    busyRef.current = true;
    const finish = () => {
      busyRef.current = false;
      onClickRef.current?.(event);
      if (!button?.isConnected) return;
      if (!button.matches(":hover") && document.activeElement !== button) handleLeave();
    };
    const press = () => {
      if (reducedRef.current) return finish();
      pressRef.current = gsap.timeline({ onComplete: finish })
        .to(shape, { scale: 0.93, duration: 0.1, ease: "power2.out" })
        .to(shape, { scale: 1, duration: 0.18, ease: "back.out(1.25)" });
    };
    if (reducedRef.current) {
      tl.progress(1).pause();
      press();
    } else {
      clickTweenRef.current = tl.tweenTo(tl.duration(), { onComplete: press });
    }
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      className={`meow-morph-button meow-morph-button--${variant} ${className}`.trim()}
      style={{ "--morph-color": color, "--morph-text": textColor }}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      onClick={handleClick}
      {...rest}
    >
      <svg className="meow-morph-button__svg" viewBox="0 0 128 128" aria-hidden="true">
        <defs>
          <filter id={`meow-goo-${uid}`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.25" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" />
          </filter>
        </defs>
        <g data-shape fill="var(--morph-color)" filter={`url(#meow-goo-${uid})`}>
          <path data-main d={BUTTON} />
          <path data-toe d="M79.07,14.51c8.19-.74,14.78,9.37,15.44,16.66.83,9.23-4.42,20.57-15.19,19.41-16.06-1.72-16.22-34.63-.25-36.07Z" />
          <ellipse data-toe cx="104.82" cy="59.09" rx="12.87" ry="16.75" transform="rotate(-3.77 104.82 59.09)" />
          <path data-toe d="M48.93,14.51c-8.19-.74-14.78,9.37-15.44,16.66-.83,9.23,4.42,20.57,15.19,19.41,16.06-1.72,16.22-34.63.25-36.07Z" />
          <ellipse
  data-toe
  cx="23.18"
  cy="59.09"
  rx="12.87"
  ry="16.75"
  transform="rotate(3.77 23.18 59.09)"
/>
        </g>
        <text data-label x="64" y="68" textAnchor="middle" className="meow-morph-button__label">{children}</text>
      </svg>
    </button>
  );
}

