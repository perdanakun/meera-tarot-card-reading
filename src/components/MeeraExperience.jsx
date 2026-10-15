
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
  const [revealed, setRevealed] = useState([]);
  const [flipping, setFlipping] = useState([]);
  const [activeId, setActiveId] = useState(null);
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

  const schedule = useCallback((action, delay) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      action();
    }, delay);

    timers.current.add(timer);
    return timer;
  }, []);

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

    const next = [...selected, card];
    setSelected(next);

    // All three cards stay in SelectionScene for fan exit, zoom and flip.

  }

  function removeChoice(card) {
    if (scene !== "selection") return;

    setSelected((items) =>
      items.filter((item) => item.id !== card.id)
    );
  }

  /* CARD REVEAL */

  function reveal(card) {
    if (
      scene !== "selection" ||
      flipping.includes(card.id)
    ) {
      return;
    }

    if (revealed.includes(card.id)) return;

    setFlipping((items) => [...items, card.id]);

    schedule(() => {
      setRevealed((items) =>
        items.includes(card.id)
          ? items
          : [...items, card.id]
      );
      setActiveId(card.id);
    }, reducedMotion ? 0 : 490);

    schedule(() => {
      setFlipping((items) =>
        items.filter((id) => id !== card.id)
      );
    }, reducedMotion ? 20 : 1000);
  }

  /* AUTO RESULT — after all three flip animations have settled. */
  useEffect(() => {
    if (
      scene !== "selection" ||
      selected.length !== REQUIRED_CARDS ||
      !selected.every((card) => revealed.includes(card.id)) ||
      flipping.length > 0
    ) return;

    // Brief hold on three opened cards, then gather and enter ResultScene.
    const hold = schedule(() => setScene("gathering"), reducedMotion ? 0 : 320);
    return () => {
      window.clearTimeout(hold);
      timers.current.delete(hold);
    };
  }, [scene, selected, revealed, flipping, reducedMotion, schedule]);

  useEffect(() => {
    if (scene !== "gathering") return;
    const pending = schedule(() => setScene("result"), reducedMotion ? 100 : 1050);
    return () => {
      window.clearTimeout(pending);
      timers.current.delete(pending);
    };
  }, [scene, reducedMotion, schedule]);

  /* RESULT */

  /* RESET */

  function reset() {
    timers.current.forEach(window.clearTimeout);
    timers.current.clear();

    setSelected([]);
    setRevealed([]);
    setFlipping([]);
    setActiveId(null);
    setRun((value) => value + 1);
    setScene("intro");
  }

  function returnToCards() {
    setScene("selection");
    setActiveId(selected[0]?.id ?? null);
  }

  /* SCENE RESOLUTION */

  const visibleScene =
    scene === "intro-entering" ? "intro" :
    scene === "intro-arriving" ? "selection" :
    scene === "gathering" ? "selection" : scene;

  const activeCard = selected.find(
    (card) => card.id === activeId
  );

  const status =
    scene === "intro-entering" || scene === "intro-arriving"
      ? "Entering the card experience."
      : scene === "selection"
        ? `${selected.length} of ${REQUIRED_CARDS} cards selected.`
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
        />
      )}

      {visibleScene === "selection" && (
        <SelectionScene
          cards={deck}
          selected={selected}
          locked={scene === "gathering" || scene === "intro-arriving"}
          onChoose={choose}
          onRemove={removeChoice}
          revealed={revealed}
          onReveal={reveal}
        />
      )}

      {visibleScene === "result" && (
        <ResultScene
          selected={selected}
          titleRef={resultTitle}
          onReset={reset}
          onReturn={returnToCards}
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