import { useEffect, useRef } from "react";
import { TarotCardView } from "./TarotCard";

function fanPosition(index, total) {
  const maxAngle = 42;

  const angle =
    total <= 1
      ? 0
      : -maxAngle +
        index * ((maxAngle * 2) / (total - 1));

  const radians = (angle * Math.PI) / 180;
  const radius = 690;

  return {
    "--fan-x": `${Math.sin(radians) * radius}px`,
    "--fan-y": `${radius * (1 - Math.cos(radians))}px`,
    "--fan-r": `${angle * 0.9}deg`,
    "--fan-delay": `${Math.min(index * 0.025, 0.42)}s`,
  };
}

export default function SelectionScene({
  cards,
  selected,
  locked,
  onChoose,
  onRemove,
}) {
  const viewport = useRef(null);
  const cardButtons = useRef({});

  useEffect(() => {
    const element = viewport.current;

    if (!element) return;

    element.scrollLeft =
      (element.scrollWidth - element.clientWidth) / 2;
  }, []);

  function navigate(event, card) {
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ].includes(event.key)
    ) {
      return;
    }

    event.preventDefault();

    const current = cards.findIndex(
      (item) => item.id === card.id,
    );

    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? cards.length - 1
          : (
              current +
              (event.key === "ArrowRight"
                ? 1
                : -1) +
              cards.length
            ) %
            cards.length;

    const nextButton =
      cardButtons.current[cards[next].id];

    nextButton?.focus({
      preventScroll: true,
    });

    nextButton?.scrollIntoView({
      block: "nearest",
      inline: "center",
    });
  }

  return (
    <section
      className={`selection-scene ${
        locked ? "is-locked" : ""
      }`}
      aria-labelledby="selection-title"
    >
      <div className="selection-intro">
        <p className="eyebrow">
          The first feeling is enough
        </p>

        <h2 id="selection-title">
          Choose three cards.
        </h2>

        <p>
          Don&apos;t overthink it. Pick the ones
          <br className="desktop-only" /> that pull
          you in.
        </p>
      </div>

      <div
        className="card-spread-viewport"
        ref={viewport}
        aria-label={`${selected.length} of 3 cards selected`}
      >
        <div className="card-spread">
          {cards.map((card, index) => {
            const selectedIndex =
              selected.findIndex(
                (item) => item.id === card.id,
              );

            const chosen =
              selectedIndex !== -1;

            return (
              <button
                key={card.id}
                ref={(node) => {
                  cardButtons.current[card.id] =
                    node;
                }}
                className={`spread-card ${
                  chosen ? "is-chosen" : ""
                }`}
                style={{
                  ...fanPosition(
                    index,
                    cards.length,
                  ),

                  "--selected-index":
                    selectedIndex,

                  "--final-x":
                    selectedIndex === -1
                      ? "0px"
                      : `${
                          (selectedIndex - 1) *
                          190
                        }px`,

                  "--final-r":
                    selectedIndex === 0
                      ? "-4deg"
                      : selectedIndex === 2
                        ? "4deg"
                        : "0deg",

                  /*
                   * IMPORTANT:
                   * Keep the physical fan stacking.
                   *
                   * Hover / selected cards do NOT
                   * become the top card.
                   */
                  zIndex: index + 1,
                }}
                onClick={() => {
                  if (locked) return;

                  if (chosen) {
                    onRemove(card);
                  } else {
                    onChoose(card);
                  }
                }}
                onKeyDown={(event) =>
                  navigate(event, card)
                }
                aria-pressed={chosen}
                aria-label={
                  chosen
                    ? `${card.name} selected. Click to return it to the deck.`
                    : `Choose face-down card ${index + 1}`
                }
                disabled={locked}
              >
                <TarotCardView card={card} />
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="selection-status"
        aria-live="polite"
      >
        {locked
          ? "Your cards are finding their place"
          : `${selected.length} / 3 selected`}
      </div>

      <p className="selection-hint">
        <span className="desktop-hint">
          Let your attention wander.
        </span>

        <span className="mobile-hint">
          Swipe across the deck.
        </span>
      </p>
    </section>
  );
}