import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { tarotCards } from "../data/cards";

import IntroScene from "./IntroScene";
import SelectionScene from "./SelectionScene";
import RevealScene from "./RevealScene";
import ResultScene from "./ResultScene";
import ThemeSwitch from "./ThemeSwitch";

function useReducedMotion() {
  const [reduced, setReduced] =
    useState(false);

  useEffect(() => {
    const query = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const update = () => {
      setReduced(query.matches);
    };

    update();
    query.addEventListener("change", update);

    return () => {
      query.removeEventListener(
        "change",
        update,
      );
    };
  }, []);

  return reduced;
}

export default function MeeraExperience() {
  const reducedMotion =
    useReducedMotion();

  const [scene, setScene] =
    useState("intro");

  const [selected, setSelected] =
    useState([]);

  const [revealed, setRevealed] =
    useState([]);

  const [flipping, setFlipping] =
    useState([]);

  const [activeId, setActiveId] =
    useState(null);

  const [run, setRun] =
    useState(0);

  const timers =
    useRef(new Set());

  const firstRevealButton =
    useRef(null);

  const resultTitle =
    useRef(null);

  const deck = useMemo(() => {
    const offset =
      (run * 7) %
      tarotCards.length;

    return [
      ...tarotCards.slice(offset),
      ...tarotCards.slice(0, offset),
    ];
  }, [run]);

  const schedule = useCallback(
    (action, delay) => {
      const timer =
        window.setTimeout(() => {
          timers.current.delete(timer);
          action();
        }, delay);

      timers.current.add(timer);

      return timer;
    },
    [],
  );

  useEffect(
    () => () => {
      timers.current.forEach(
        window.clearTimeout,
      );

      timers.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (scene === "reveal") {
      firstRevealButton.current?.focus({
        preventScroll: true,
      });
    }

    if (scene === "result") {
      resultTitle.current?.focus({
        preventScroll: true,
      });
    }
  }, [scene]);

  function begin() {
    setScene("entering");

    schedule(
      () => {
        setScene("selection");
      },
      reducedMotion
        ? 80
        : 1250,
    );
  }

  function choose(card) {
    if (
      scene !== "selection" ||
      selected.some(
        (item) =>
          item.id === card.id,
      )
    ) {
      return;
    }

    const next = [
      ...selected,
      card,
    ];

    setSelected(next);

    if (next.length === 3) {
      setScene(
        "selection-complete",
      );

      schedule(
        () => {
          setScene("reveal");
        },
        reducedMotion
          ? 100
          : 1650,
      );
    }
  }

  function removeChoice(card) {
    if (scene !== "selection") {
      return;
    }

    setSelected((items) =>
      items.filter(
        (item) =>
          item.id !== card.id,
      ),
    );
  }

  function reveal(card) {
    if (
      scene !== "reveal" ||
      flipping.includes(card.id)
    ) {
      return;
    }

    if (
      revealed.includes(card.id)
    ) {
      setActiveId(card.id);
      return;
    }

    setFlipping((items) => [
      ...items,
      card.id,
    ]);

    schedule(
      () => {
        setRevealed((items) => [
          ...items,
          card.id,
        ]);

        setActiveId(card.id);
      },
      reducedMotion
        ? 0
        : 160,
    );

    schedule(
      () => {
        setFlipping((items) =>
          items.filter(
            (id) =>
              id !== card.id,
          ),
        );
      },
      reducedMotion
        ? 80
        : 980,
    );
  }

  function showResult() {
    if (
      revealed.length !== 3 ||
      flipping.length > 0
    ) {
      return;
    }

    setScene("gathering");
    setActiveId(null);

    schedule(
      () => {
        setScene("result");
      },
      reducedMotion
        ? 100
        : 1050,
    );
  }

  function reset() {
    timers.current.forEach(
      window.clearTimeout,
    );

    timers.current.clear();

    setSelected([]);
    setRevealed([]);
    setFlipping([]);
    setActiveId(null);

    setRun(
      (value) =>
        value + 1,
    );

    setScene("intro");
  }

  function returnToCards() {
    setScene("reveal");

    setActiveId(
      selected[0]?.id ?? null,
    );
  }

  const visibleScene =
    scene === "entering"
      ? "intro"
      : scene ===
          "selection-complete"
        ? "selection"
        : scene === "gathering"
          ? "reveal"
          : scene;

  const activeCard =
    selected.find(
      (card) =>
        card.id === activeId,
    );

  const settledReveals =
    revealed.filter(
      (id) =>
        !flipping.includes(id),
    ).length;

  const status =
    scene === "selection"
      ? `${selected.length} of 3 cards selected.`
      : scene === "reveal"
        ? `${settledReveals} of 3 cards revealed.`
        : scene === "result"
          ? "Your reflection is ready."
          : "The cards are moving.";

  return (
    <main
      className={`meera-shell scene-${scene}`}
      data-scene={visibleScene}
    >
      <div
        className="grain"
        aria-hidden="true"
      />

      <div className="meera-theme-control">
        <ThemeSwitch />
      </div>

      {visibleScene === "intro" && (
        <IntroScene
          deck={deck}
          entering={
            scene === "entering"
          }
          onBegin={begin}
        />
      )}

      {visibleScene ===
        "selection" && (
        <SelectionScene
          cards={deck}
          selected={selected}
          locked={
            scene ===
            "selection-complete"
          }
          onChoose={choose}
          onRemove={removeChoice}
        />
      )}

      {visibleScene ===
        "reveal" && (
        <RevealScene
          selected={selected}
          revealed={revealed}
          flipping={flipping}
          activeCard={activeCard}
          gathering={
            scene === "gathering"
          }
          firstButtonRef={
            firstRevealButton
          }
          onReveal={reveal}
          onContinue={showResult}
        />
      )}

      {visibleScene ===
        "result" && (
        <ResultScene
          selected={selected}
          titleRef={resultTitle}
          onReset={reset}
          onReturn={
            returnToCards
          }
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
