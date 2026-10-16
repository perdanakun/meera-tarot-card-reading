
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { tarotCards } from "../data/cards";

const REQUIRED_CARDS = 3;

import IntroScene from "./IntroScene";
import SelectionScene from "./SelectionScene";
import ResultScene from "./ResultScene";

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  });

  useEffect(() => {
    const query = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const update = () => setReduced(query.matches);

    update();
    query.addEventListener("change", update);

    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  return reduced;
}

export default function MeeraExperience() {
  const reducedMotion = useReducedMotion();

  const [scene, setScene] = useState("intro");

  const [selected, setSelected] = useState([]);
  const [reviewing, setReviewing] = useState(false);
  const [run, setRun] = useState(0);

  const timers = useRef(new Set());

  const resultTitle = useRef(null);

  const deck = useMemo(() => {
    const offset = (run * 7) % tarotCards.length;

    return [
      ...tarotCards.slice(offset),
      ...tarotCards.slice(0, offset),
    ];
  }, [run]);

  useEffect(() => {
    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (scene === "result") {
      resultTitle.current?.focus({
        preventScroll: true,
      });
    }
  }, [scene]);

  /* INTRO → PAW EYE PORTAL → SELECTION */

  function begin() {
    if (scene !== "intro") return;
    setScene("intro-entering");
  }

  const handlePortalReached = useCallback(() => {
    setScene((current) =>
      current === "intro-entering" ? "intro-arriving" : current
    );
  }, []);

  const handlePortalComplete = useCallback(() => {
    setScene((current) =>
      current === "intro-arriving" ? "selection" : current
    );
  }, []);

  /* CARD SELECTION */

  function choose(card) {
    if (
      scene !== "selection" ||
      selected.length >= REQUIRED_CARDS ||
      selected.some((item) => item.id === card.id)
    ) {
      return;
    }

    setSelected((items) => items.length < REQUIRED_CARDS && !items.some((item) => item.id === card.id)
      ? [...items, card] : items);

    // All three cards stay in SelectionScene for fan exit, zoom and flip.

  }

  function removeChoice(card) {
    if (scene !== "selection" || selected.length === REQUIRED_CARDS) return;

    setSelected((items) =>
      items.filter((item) => item.id !== card.id)
    );
  }

  const finishSpread = useCallback(() => {
    setScene((current) => current === "selection" ? "result" : current);
  }, []);

  /* RESULT */

  /* RESET */

  function reset() {
    timers.current.forEach(window.clearTimeout);
    timers.current.clear();

    setSelected([]);
    setReviewing(false);
    setRun((value) => value + 1);
    setScene("intro");
  }

  function returnToCards() {
    setReviewing(true);
    setScene("selection");
  }

  /* SCENE RESOLUTION */

  const visibleScene =
    scene === "intro-entering" ? "intro" :
    scene === "intro-arriving" ? "selection" :
    scene;

  const status =
    scene === "intro-entering" || scene === "intro-arriving"
      ? "Entering the card experience."
      : scene === "selection"
        ? selected.length === REQUIRED_CARDS
          ? "Three cards selected. Moving to your reading."
          : `${selected.length} of ${REQUIRED_CARDS} cards selected.`
          : scene === "result"
            ? "Your reflection is ready."
            : "The cards are moving.";

  return (
    <main
      className={`meera-shell scene-${scene}`}
      data-scene={visibleScene}
    >


      {(scene === "intro" || scene === "intro-entering" || scene === "intro-arriving") && (
        <IntroScene
          deck={deck}
          entering={scene === "intro-entering" || scene === "intro-arriving"}
          arriving={scene === "intro-arriving"}
          onBegin={begin}
          onPortalReached={handlePortalReached}
          onTransitionComplete={handlePortalComplete}
          reducedMotion={reducedMotion}
        />
      )}

      {visibleScene === "selection" && (
        <SelectionScene
          cards={deck}
          selected={selected}
          locked={scene === "intro-arriving"}
          onChoose={choose}
          onRemove={removeChoice}
          reducedMotion={reducedMotion}
          reviewing={reviewing}
          onSpreadComplete={finishSpread}
          onContinue={() => setScene("result")}
        />
      )}

      {visibleScene === "result" && (
        <ResultScene
          selected={selected}
          titleRef={resultTitle}
          onReset={reset}
          onReturn={returnToCards}
          reducedMotion={reducedMotion}
        />
      )}

      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {status}
      </p>
    </main>
  );
}