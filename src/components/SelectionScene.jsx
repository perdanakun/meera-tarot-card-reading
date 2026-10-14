import { useEffect, useRef, useState } from "react";
import { TarotCardView } from "./TarotCard";
import "./SelectionScene.css";

const MOBILE_BREAKPOINT = 800;

/*
 * Berapa card dari center sampai tepi fan di mobile.
 *
 * Dengan 5:
 *
 * [edge] 4 3 2 1 CENTER 1 2 3 4 [edge]
 *
 * Artinya:
 * - card pertama berhenti di sisi kiri fan
 * - card terakhir berhenti di sisi kanan fan
 * - keduanya tidak pernah bisa masuk ke center
 */
const MOBILE_VISIBLE_SIDE = 5;

/* =====================================================
   FAN POSITION
===================================================== */

function fanPosition(
  index,
  total,
  mobile = false,
  rotationOffset = 0,
) {
  /* -----------------------------------------------------
     MOBILE
  ----------------------------------------------------- */

  if (mobile) {
    const visualIndex = index - rotationOffset;

    const hidden =
      Math.abs(visualIndex) > MOBILE_VISIBLE_SIDE;

    /*
     * Fan mobile lebih rapat daripada desktop.
     */
    const angleStep = 7.2;

    const angle = visualIndex * angleStep;

    /*
     * Radius menentukan jarak horizontal antar kartu.
     *
     * Kalau nanti masih terlalu renggang:
     * turunkan radius.
     *
     * Kalau edge belum cukup mepet layar:
     * naikkan radius sedikit.
     */
    const radius = 285;

    const radians = (angle * Math.PI) / 180;

    return {
      "--fan-x": `${Math.sin(radians) * radius}px`,

      "--fan-y": `${
        radius * (1 - Math.cos(radians)) * 0.60
      }px`,

      "--fan-r": `${angle * 0.72}deg`,

      "--fan-delay": "0s",

      "--fan-opacity": hidden ? 0 : 1,

      "--fan-pointer": hidden ? "none" : "auto",
    };
  }

  /* -----------------------------------------------------
     DESKTOP
  ----------------------------------------------------- */

  const maxAngle = 62;

  const angle =
    total <= 1
      ? 0
      : -maxAngle +
        index * ((maxAngle * 2) / (total - 1));

  const radians = (angle * Math.PI) / 180;
  const radius = typeof window === "undefined" ? 690 : Math.min(870, Math.max(340, window.innerWidth * 0.49));

  return {
    "--fan-x": `${Math.sin(radians) * radius}px`,

    "--fan-y": `${
      radius * (1 - Math.cos(radians)) * 0.60
    }px`,

    "--fan-r": `${angle * 0.9}deg`,

    "--fan-delay": `${Math.min(
      index * 0.025,
      0.42,
    )}s`,

    "--fan-opacity": 1,

    "--fan-pointer": "auto",
  };
}

/* =====================================================
   COMPONENT
===================================================== */

export default function SelectionScene({
  cards,
  selected,
  locked,
  onChoose,
  onRemove,
}) {
  const viewport = useRef(null);
  const cardButtons = useRef({});

  const pointer = useRef({
    active: false,

    startX: 0,
    lastX: 0,

    accumulated: 0,

    moved: false,

    card: null,
  });

  const [isMobile, setIsMobile] = useState(false);

  const [rotationOffset, setRotationOffset] =
    useState(0);

  const [dragging, setDragging] = useState(false);

  const [pressedCardId, setPressedCardId] =
    useState(null);

  /* ===================================================
     MEDIA QUERY
  =================================================== */

  useEffect(() => {
    const query = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT}px)`,
    );

    const update = () => {
      setIsMobile(query.matches);
    };

    update();

    query.addEventListener("change", update);

    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  /* ===================================================
     OFFSET LIMIT
  =================================================== */
function clampOffset(value) {
  const total = cards.length;

  if (total <= 1) {
    return 0;
  }

  /*
   * Base edge berdasarkan jumlah
   * visible cards di sisi fan.
   */
  const baseMinOffset = Math.min(
    MOBILE_VISIBLE_SIDE,
    Math.floor((total - 1) / 2),
  );

  const baseMaxOffset = Math.max(
    baseMinOffset,
    total - 1 - MOBILE_VISIBLE_SIDE,
  );

  /*
   * Extra edge allowance.
   *
   * LEFT  = -1
   * RIGHT = +1
   *
   * Tujuannya supaya card paling ujung
   * masuk sedikit lebih ke viewport
   * dan tetap terlihat.
   */
  const minOffset = Math.max(
    0,
    baseMinOffset - 1,
  );

  const maxOffset = Math.min(
    total - 1,
    baseMaxOffset + 1,
  );

  return Math.min(
    maxOffset,
    Math.max(minOffset, value),
  );
}

  /* ===================================================
     MOBILE INITIAL POSITION
  =================================================== */

  useEffect(() => {
    /*
     * Desktop tidak menggunakan rotation offset.
     */
    if (!isMobile) {
      setRotationOffset(0);
      return;
    }

    /*
     * Mobile dimulai dengan card pertama
     * di sisi kiri fan, bukan di center.
     */
  const initialOffset = Math.max(
    0,
    Math.min(
      MOBILE_VISIBLE_SIDE,
      Math.floor((cards.length - 1) / 2),
    ) - 1,
  );

  setRotationOffset(initialOffset);
  }, [isMobile, cards.length]);

  /* ===================================================
     KEYBOARD
  =================================================== */

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

    let next;

    if (event.key === "Home") {
      next = isMobile
        ? clampOffset(0)
        : 0;
    } else if (event.key === "End") {
      next = isMobile
        ? clampOffset(cards.length - 1)
        : cards.length - 1;
    } else {
      next = isMobile
        ? clampOffset(
            current +
              (event.key === "ArrowRight"
                ? 1
                : -1),
          )
        : (
            current +
            (event.key === "ArrowRight"
              ? 1
              : -1) +
            cards.length
          ) % cards.length;
    }

    if (isMobile) {
      setRotationOffset(next);
    }

    const nextButton =
      cardButtons.current[cards[next]?.id];

    nextButton?.focus({
      preventScroll: true,
    });
  }

  /* ===================================================
     MOBILE POINTER DOWN
  =================================================== */

  function handlePointerDown(event, card) {
    if (!isMobile || locked) {
      return;
    }

    const alreadySelected = selected.some(
      (item) => item.id === card.id,
    );

    if (alreadySelected) {
      return;
    }

    pointer.current = {
      active: true,

      startX: event.clientX,
      lastX: event.clientX,

      accumulated: 0,

      moved: false,

      card,
    };

    /*
     * Touch down langsung membuat card peek.
     */
    setPressedCardId(card.id);

    event.currentTarget.setPointerCapture?.(
      event.pointerId,
    );
  }

  /* ===================================================
     MOBILE POINTER MOVE / SWIPE
  =================================================== */

  function handlePointerMove(event) {
    if (
      !isMobile ||
      locked ||
      !pointer.current.active
    ) {
      return;
    }

    const deltaFromStart =
      event.clientX - pointer.current.startX;

    const frameDelta =
      event.clientX - pointer.current.lastX;

    pointer.current.lastX = event.clientX;

    /*
     * Selama gerakan kecil,
     * interaction masih dianggap press / hold.
     */
    const DRAG_THRESHOLD = 10;

    if (
      Math.abs(deltaFromStart) >
      DRAG_THRESHOLD
    ) {
      pointer.current.moved = true;

      setDragging(true);

      /*
       * Begitu jadi swipe,
       * card tidak lagi peek.
       */
      setPressedCardId(null);
    }

    if (!pointer.current.moved) {
      return;
    }

    pointer.current.accumulated += frameDelta;

    /*
     * Jarak swipe untuk pindah 1 step/card.
     *
     * Lebih kecil = wheel lebih responsif.
     */
    const STEP = 24;

    while (
      Math.abs(pointer.current.accumulated) >=
      STEP
    ) {
      /*
       * Swipe ke kiri:
       * masuk ke kartu berikut.
       */
      if (pointer.current.accumulated < 0) {
        setRotationOffset((current) =>
          clampOffset(current + 1),
        );

        pointer.current.accumulated += STEP;
      }

      /*
       * Swipe ke kanan:
       * kembali ke kartu sebelumnya.
       */
      else {
        setRotationOffset((current) =>
          clampOffset(current - 1),
        );

        pointer.current.accumulated -= STEP;
      }
    }
  }

  /* ===================================================
     MOBILE POINTER UP
  =================================================== */

  function handlePointerUp(event) {
    if (
      !isMobile ||
      !pointer.current.active
    ) {
      return;
    }

    const {
      moved,
      card,
    } = pointer.current;

    pointer.current.active = false;

    pointer.current.card = null;

    pointer.current.accumulated = 0;

    pointer.current.moved = false;

    setDragging(false);

    setPressedCardId(null);

    event.currentTarget.releasePointerCapture?.(
      event.pointerId,
    );

    /*
     * Touch:
     *
     * down
     * → peek
     *
     * release tanpa drag
     * → select
     * → masuk ke slot
     */
    if (
      !moved &&
      card &&
      !locked
    ) {
      onChoose(card);
    }
  }

  /* ===================================================
     MOBILE POINTER CANCEL
  =================================================== */

  function handlePointerCancel(event) {
    pointer.current.active = false;

    pointer.current.card = null;

    pointer.current.accumulated = 0;

    pointer.current.moved = false;

    setDragging(false);

    setPressedCardId(null);

    event.currentTarget.releasePointerCapture?.(
      event.pointerId,
    );
  }

  /* ===================================================
     DESKTOP CLICK
  =================================================== */

  function handleDesktopClick(card, chosen) {
    if (
      locked ||
      isMobile
    ) {
      return;
    }

    if (chosen) {
      onRemove(card);
    } else {
      onChoose(card);
    }
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <section
      className={`selection-scene ${
        locked ? "is-locked" : ""
      } ${
        isMobile
          ? "is-mobile-wheel"
          : ""
      }`}
      aria-labelledby="selection-title"
    >
      {/* ===================================
          INTRO
      =================================== */}

      <div className="selection-intro">
        <p className="eyebrow">
          The first feeling is enough
        </p>

        <h2 id="selection-title">
          Choose one card.
        </h2>
      </div>

      {/* ===================================
          SINGLE SELECTED CARD
      =================================== */}

      <div
        className="selection-picks"
        aria-label={`${selected.length} of 1 card selected`}
      >
        <div className={`selection-pick-slot ${selected[0] ? "has-card" : ""}`}>
          {selected[0] ? (
            <button
              type="button"
              className="selection-pick-card"
              onClick={() => !locked && onRemove(selected[0])}
              disabled={locked}
              aria-label={`${selected[0].name} selected. Return card to deck.`}
            >
              <TarotCardView card={selected[0]} />
            </button>
          ) : (
            <span className="selection-pick-placeholder" aria-hidden="true">?</span>
          )}
        </div>
      </div>

      {/* ===================================
          FAN
      =================================== */}

      <div
        className={`card-spread-viewport ${
          dragging ? "is-dragging" : ""
        }`}
        ref={viewport}
      >
        <div className="card-spread">
          {cards.map((card, index) => {
            const selectedIndex =
              selected.findIndex(
                (item) =>
                  item.id === card.id,
              );

            const chosen =
              selectedIndex !== -1;

            const pressed =
              pressedCardId === card.id;

            const fanStyle =
              fanPosition(
                index,
                cards.length,
                isMobile,
                rotationOffset,
              );

            return (
              <button
                key={card.id}
                type="button"
                ref={(node) => {
                  cardButtons.current[
                    card.id
                  ] = node;
                }}
                className={`spread-card ${
                  chosen
                    ? "is-chosen"
                    : ""
                } ${
                  pressed
                    ? "is-pressed"
                    : ""
                }`}
                style={{
                  ...fanStyle,

                  "--selected-index":
                    selectedIndex,

                  /*
                   * Physical stacking fan.
                   *
                   * Hover desktop dan press mobile
                   * tetap menggunakan layer asli.
                   */
                  "--fan-z": index + 1,

                  zIndex: isMobile ? index + 1 : cards.length - Math.abs(index - (cards.length - 1) / 2),
                }}
                onClick={() =>
                  handleDesktopClick(
                    card,
                    chosen,
                  )
                }
                onPointerDown={(event) =>
                  handlePointerDown(
                    event,
                    card,
                  )
                }
                onPointerMove={
                  handlePointerMove
                }
                onPointerUp={
                  handlePointerUp
                }
                onPointerCancel={
                  handlePointerCancel
                }
                onKeyDown={(event) =>
                  navigate(
                    event,
                    card,
                  )
                }
                aria-pressed={chosen}
                aria-label={
                  chosen
                    ? `${card.name} selected`
                    : `Choose face-down card ${
                        index + 1
                      }`
                }
                disabled={locked}
              >
                <TarotCardView
                  card={card}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================
          STATUS
      =================================== */}

      <div
        className="selection-status"
        aria-live="polite"
      >
        {locked
          ? "Your cards are finding their place"
          : `${selected.length} / 1 selected`}
      </div>

      <p className="selection-hint">
        <span className="desktop-hint">
          Let your attention wander.
        </span>

        <span className="mobile-hint">
          Swipe to explore · press and release to choose
        </span>
      </p>
    </section>
  );
}