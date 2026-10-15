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

  /* Desktop: rotating window, so every card is reachable via wheel. */
  const visualIndex = index - rotationOffset;
  const angle = visualIndex * 6.8;
  const radius = typeof window === "undefined" ? 520 : Math.min(690, Math.max(340, window.innerWidth * 0.42));
  const radians = (angle * Math.PI) / 180;
  const hidden = Math.abs(visualIndex) > 7;

  return {
    "--fan-x": `${Math.sin(radians) * radius}px`,
    "--fan-y": `${radius * (1 - Math.cos(radians)) * 0.60}px`,
    "--fan-r": `${angle * 0.85}deg`,
    "--fan-delay": "0s",
    "--fan-opacity": hidden ? 0 : 1,
    "--fan-pointer": hidden ? "none" : "auto",
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
  revealed = [],
  onReveal,
}) {
  const viewport = useRef(null);
  const cardButtons = useRef({});
  const pickSlots = useRef([]);
  const flying = useRef(false);
  const wheelAccum = useRef(0);
  const MAX_SELECTION = 3;
  const POSITIONS = ["Past", "Present", "Future"];
  const [phase, setPhase] = useState("choosing");
  const [flippingIds, setFlippingIds] = useState([]);
  const flipTimers = useRef(new Set());

  useEffect(() => () => {
    flipTimers.current.forEach(window.clearTimeout);
    flipTimers.current.clear();
  }, []);

  // Complete the third card's flight before the fan departs.
  useEffect(() => {
    if (selected.length !== MAX_SELECTION || phase !== "choosing") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exit = window.setTimeout(() => setPhase("departing"), reduce ? 0 : 380);
    const focus = window.setTimeout(() => setPhase("reading"), reduce ? 50 : 1180);
    return () => { window.clearTimeout(exit); window.clearTimeout(focus); };
  }, [selected.length, phase]);

  function revealInPlace(card) {
    if (phase !== "reading" || revealed.includes(card.id) || flippingIds.includes(card.id)) return;
    setFlippingIds((ids) => [...ids, card.id]);
    onReveal?.(card);
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 10 : 980;
    const timer = window.setTimeout(() => {
      flipTimers.current.delete(timer);
      setFlippingIds((ids) => ids.filter((id) => id !== card.id));
    }, duration);
    flipTimers.current.add(timer);
  }


  function chooseWithMotion(card) {
    if (locked || phase !== "choosing" || flying.current || selected.length >= MAX_SELECTION || selected.some((item) => item.id === card.id)) return;
    const source = cardButtons.current[card.id];
    const target = pickSlots.current[selected.length];
    const start = source?.getBoundingClientRect();
    const end = target?.getBoundingClientRect();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!source || !start || !end || reduce) { onChoose(card); return; }

    const clone = source.cloneNode(true);
    Object.assign(clone.style, {
      position: "fixed", left: `${start.left}px`, top: `${start.top}px`,
      width: `${start.width}px`, height: `${start.height}px`,
      margin: "0", transform: "none", transformOrigin: "center center",
      zIndex: "9999", pointerEvents: "none", opacity: "1", transition: "none",
    });
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    document.body.appendChild(clone);
    flying.current = true;
    const dx = end.left + end.width / 2 - (start.left + start.width / 2);
    const dy = end.top + end.height / 2 - (start.top + start.height / 2);
    const scale = end.width / start.width;
    const animation = clone.animate([
      { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${scale})`, opacity: 1 },
    ], { duration: 520, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" });
    const finish = () => {
      clone.remove(); flying.current = false; onChoose(card);
    };
    animation.finished.then(finish).catch(() => { clone.remove(); flying.current = false; });
  }

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
    if (total <= 1) return 0;
    // Allow first and last cards to reach the center of the fan.
    return Math.min(total - 1, Math.max(0, value));
}

  /* ===================================================
     MOBILE INITIAL POSITION
  =================================================== */

  useEffect(() => {
    /*
     * Desktop tidak menggunakan rotation offset.
     */
    if (!isMobile) {
      setRotationOffset(Math.min(6, Math.max(0, cards.length - 1)));
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

    setRotationOffset(next);

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
    if (!isMobile || locked || phase !== "choosing") {
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
      locked || phase !== "choosing" ||
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
    if (!moved && card && !locked && phase === "choosing") {
      chooseWithMotion(card);
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
      locked || phase !== "choosing" ||
      isMobile
    ) {
      return;
    }

    if (chosen) {
      onRemove(card);
    } else {
      chooseWithMotion(card);
    }
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <section
      className={`selection-scene is-${phase} ${
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
          Choose three cards.
        </h2>
      </div>

      {/* No visible placeholders: positions are spatial anchors for the flight. */}
      <div className="selection-picks" aria-label={`${selected.length} of 3 cards selected`}>
        {POSITIONS.map((position, index) => (
          <div key={position} className={`selection-pick-slot ${selected[index] ? "has-card" : ""}`}
            ref={(node) => { pickSlots.current[index] = node; }}>
            {selected[index] && (
              <>
                <button type="button"
                  className={`selection-pick-card ${revealed.includes(selected[index].id) ? "is-revealed" : ""} ${flippingIds.includes(selected[index].id) ? "is-flipping" : ""}`}
                  onClick={() => phase === "reading" ? revealInPlace(selected[index]) : (!locked && phase === "choosing" && onRemove(selected[index]))}
                  disabled={locked || phase === "departing" || (phase === "reading" && (revealed.includes(selected[index].id) || flippingIds.includes(selected[index].id)))}
                  aria-label={`${position}: ${selected[index].name}. ${revealed.includes(selected[index].id) ? "Revealed" : phase === "reading" ? "Tap to reveal" : "Selected"}`}>
                  <span className="selection-flip-inner">
                    <span className="selection-card-face selection-card-back" aria-hidden={revealed.includes(selected[index].id)}>
                      <TarotCardView card={selected[index]} />
                    </span>
                    <span className="selection-card-face selection-card-front" aria-hidden={!revealed.includes(selected[index].id)}>
                      {/* Front placeholder is owned by Artwork.jsx until the real card artwork exists. */}
                      <TarotCardView card={selected[index]} faceUp position={position} />
                    </span>
                  </span>
                </button>
                <span className="selection-pick-label">{position}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ===================================
          FAN
      =================================== */}

      <div
        className={`card-spread-viewport ${
          dragging ? "is-dragging" : ""
        }`}
        ref={viewport}
        onWheel={(event) => {
          if (isMobile || locked || phase !== "choosing") return;
          event.stopPropagation();
          wheelAccum.current += event.deltaY;
          const step = 38;
          const moves = Math.trunc(wheelAccum.current / step);
          if (moves !== 0) {
            // Wheel down = rotate toward cards on the right; up = left.
            setRotationOffset((current) => clampOffset(current + moves));
            wheelAccum.current -= moves * step;
          }
        }}
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

    </section>
  );
}