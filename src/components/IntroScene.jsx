
import { useEffect, useState } from "react";
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

export default function IntroScene({
  entering = false,
  onBegin,
}) {
  const [stage, setStage] = useState("typing");
  const [typedCount, setTypedCount] = useState(0);
  const [catFrame, setCatFrame] = useState(0);

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
    const interval = window.setInterval(() => {
      setCatFrame(
        (previous) => (previous + 1) % CAT_FRAMES.length
      );
    }, 200);

    return () => window.clearInterval(interval);
  }, []);

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
      className={`meera-intro${
        entering ? " is-entering" : ""
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
        <div className="meera-intro__action">
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

      {/* TRANSITION */}
      {entering && (
        <div
          className="meera-intro__transition"
          aria-hidden="true"
        />
      )}
    </section>
  );
}