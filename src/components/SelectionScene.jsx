import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  viewportWidth = 1440,
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
  const radius = Math.min(690, Math.max(340, viewportWidth * 0.42));
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
  flipping = [],
  onRevealComplete,
  reducedMotion = false,
  gathering = false,
  reviewing = false,
  onContinue,
}) {
  const viewport = useRef(null);
  const cardButtons = useRef({});
  const pickSlots = useRef([]);
  const flying = useRef(null);
  const [inFlight, setInFlight] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const previousSlots = useRef([]);
  const zoomAnimations = useRef([]);
  const heading = useRef(null);
  const firstPick = useRef(null);
  const wheelAccum = useRef(0);
  const MAX_SELECTION = 3;
  const POSITIONS = ["Past", "Present", "Future"];
  const [phase, setPhase] = useState(() => selected.length === MAX_SELECTION ? "reading" : "choosing");

  useEffect(() => () => {
    flying.current?.cancel();
    zoomAnimations.current.forEach((animation) => animation.cancel());
  }, []);

  // Complete the third card's flight before the fan departs.
  useEffect(() => {
    if (selected.length !== MAX_SELECTION || phase !== "choosing") return;
    const exit = window.setTimeout(() => setPhase("departing"), reducedMotion ? 0 : 120);
    return () => window.clearTimeout(exit);
  }, [selected.length, phase, reducedMotion]);

  useEffect(() => {
    if (phase !== "departing") return;
    const timer = window.setTimeout(() => setPhase("reading"), reducedMotion ? 0 : 850);
    return () => window.clearTimeout(timer);
  }, [phase, reducedMotion]);

  useLayoutEffect(() => {
    const slots = pickSlots.current.filter(Boolean);
    const next = slots.map((slot) => slot.getBoundingClientRect());
    if (phase === "departing" && !reducedMotion) {
      zoomAnimations.current = slots.map((slot, i) => {
        const from = previousSlots.current[i];
        const to = next[i];
        if (!from || !to.width || !slot.animate) return null;
        return slot.animate([
          { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})` },
          { transform: "none" },
        ], { duration: 850, easing: "cubic-bezier(.22,1,.36,1)" });
      }).filter(Boolean);
    }
    previousSlots.current = next;
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (locked) return;
    if (phase === "reading") firstPick.current?.focus({ preventScroll: true });
    else if (phase === "choosing" && selected.length === 0) heading.current?.focus({ preventScroll: true });
  }, [locked, phase]);

  useEffect(() => {
    if (!flipping.length) return;
    const timers = flipping.map((id) => window.setTimeout(() => onRevealComplete(id), reducedMotion ? 0 : 1100));
    return () => timers.forEach(window.clearTimeout);
  }, [flipping, reducedMotion, onRevealComplete]);

  useEffect(() => {
    const resize = () => {
      flying.current?.finish();
      zoomAnimations.current.forEach((animation) => animation.cancel());
      previousSlots.current = pickSlots.current.filter(Boolean).map((slot) => slot.getBoundingClientRect());
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    flying.current?.finish();
    zoomAnimations.current.forEach((animation) => animation.cancel());
  }, [reducedMotion]);

  function revealInPlace(card) {
    if (locked || phase !== "reading" || revealed.includes(card.id) || flipping.includes(card.id)) return;
    onReveal?.(card);
  }


  function chooseWithMotion(card) {
    if (locked || phase !== "choosing" || flying.current || selected.length >= MAX_SELECTION || selected.some((item) => item.id === card.id)) return;
    const source = cardButtons.current[card.id];
    const target = pickSlots.current[selected.length];
    const start = source?.getBoundingClientRect();
    const end = target?.getBoundingClientRect();
    if (!source || !start || !end || reducedMotion || !source.animate) { onChoose(card); return; }

    const computed = getComputedStyle(source);
    const matrix = new DOMMatrix(computed.transform);
    const angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
    const startScale = Math.hypot(matrix.a, matrix.b);
    const width = parseFloat(computed.width);
    const height = parseFloat(computed.height);
    const restoreFocus = source.matches(":focus-visible");
    const clone = source.cloneNode(true);
    Object.assign(clone.style, {
      position: "fixed", left: `${start.left + start.width / 2 - width / 2}px`, top: `${start.top + start.height / 2 - height / 2}px`, bottom: "auto",
      width: `${width}px`, height: `${height}px`,
      margin: "0", transform: "none", transformOrigin: "center center",
      zIndex: "9999", pointerEvents: "none", opacity: "1", transition: "none",
    });
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    clone.inert = true;
    clone.tabIndex = -1;
    document.body.appendChild(clone);
    source.style.visibility = "hidden";
    setInFlight(true);
    const dx = end.left + end.width / 2 - (start.left + start.width / 2);
    const dy = end.top + end.height / 2 - (start.top + start.height / 2);
    const scale = end.width / width;
    const animation = clone.animate([
      { transform: `translate(0, 0) rotate(${angle}deg) scale(${startScale})`, opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${scale})`, opacity: 1 },
    ], { duration: 520, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" });
    let settled = false;
    const cleanup = () => {
      clone.remove();
      source.style.visibility = "";
      animation.cancel();
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      flying.current = null;
      setInFlight(false);
      onChoose(card);
      window.requestAnimationFrame(() => {
        cleanup();
        if (!restoreFocus || !source.isConnected || selected.length >= MAX_SELECTION - 1) return;
        const startIndex = cards.findIndex((item) => item.id === card.id);
        const next = cards.map((_, index) => (startIndex + index + 1) % cards.length)
          .find((index) => cards[index].id !== card.id && !selected.some((item) => item.id === cards[index].id));
        if (next !== undefined) {
          setFocusIndex(next);
          setRotationOffset(next);
          cardButtons.current[cards[next].id]?.focus({ preventScroll: true });
        }
      });
    };
    flying.current = { finish, cancel: () => { settled = true; cleanup(); } };
    animation.finished.then(finish).catch(() => {});
  }

  const pointer = useRef({
    active: false,

    startX: 0,
    lastX: 0,

    accumulated: 0,

    moved: false,

    card: null,
  });

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  const [rotationOffset, setRotationOffset] =
    useState(() => window.innerWidth <= MOBILE_BREAKPOINT ? Math.min(4, cards.length - 1) : Math.min(6, cards.length - 1));

  const [dragging, setDragging] = useState(false);
  const [focusIndex, setFocusIndex] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT ? Math.min(4, cards.length - 1) : Math.min(6, cards.length - 1));

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

  useEffect(() => {
    if (phase !== "choosing" || !selected.length || selected.length === MAX_SELECTION) return;
    const active = document.activeElement;
    if (!active?.classList.contains("spread-card") || active.getAttribute("aria-pressed") !== "true") return;
    const next = cards.findIndex((card) => !selected.some((item) => item.id === card.id));
    if (next >= 0) {
      setFocusIndex(next);
      setRotationOffset(next);
      cardButtons.current[cards[next].id]?.focus({ preventScroll: true });
    }
  }, [selected, phase, cards]);

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
    if (locked || phase !== "choosing" || inFlight) return;

    const current = cards.findIndex(
      (item) => item.id === card.id,
    );

    const direction = event.key === "ArrowLeft" || event.key === "End" ? -1 : 1;
    let next = event.key === "Home" ? 0 : event.key === "End" ? cards.length - 1 : (current + direction + cards.length) % cards.length;
    for (let count = 0; count < cards.length && selected.some((item) => item.id === cards[next].id); count += 1) {
      next = (next + direction + cards.length) % cards.length;
    }
    setFocusIndex(next);
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
    if (!isMobile || locked || inFlight || phase !== "choosing" || (event.button !== 0 && event.button !== undefined)) {
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

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

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

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  /* ===================================================
     DESKTOP CLICK
  =================================================== */

  function handleDesktopClick(event, card, chosen) {
    if (
      locked || phase !== "choosing" ||
      (isMobile && event.detail !== 0)
    ) {
      return;
    }

    if (!chosen) chooseWithMotion(card);
  }

  /* ===================================================
     RENDER
  =================================================== */

  const tabStop = cards.map((card, index) => ({ card, index }))
    .filter(({ card, index }) => !selected.some((item) => item.id === card.id) && Math.abs(index - rotationOffset) <= (isMobile ? MOBILE_VISIBLE_SIDE : 7))
    .sort((a, b) => Math.abs(a.index - focusIndex) - Math.abs(b.index - focusIndex))[0]?.index;

  return (
    <section
      className={`selection-scene is-${phase} ${gathering ? "is-gathering" : ""} ${
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
          {phase === "reading" ? "Turn your cards, one at a time." : "The first feeling is enough"}
        </p>

        <h2 id="selection-title" ref={heading} tabIndex={-1}>
          {phase === "reading" ? "The Reveal" : "Choose three cards."}
        </h2>
      </div>

      {/* No visible placeholders: positions are spatial anchors for the flight. */}
      <div className="selection-picks" role="group" aria-label={`${selected.length} of 3 cards selected`}>
        {POSITIONS.map((position, index) => (
          <div key={position} className={`selection-pick-slot ${selected[index] ? "has-card" : ""}`} style={{ "--pick-index": index }}
            ref={(node) => { pickSlots.current[index] = node; }}>
            {selected[index] && (
              <>
                <button type="button"
                  ref={index === 0 ? firstPick : undefined}
                  className={`selection-pick-card ${revealed.includes(selected[index].id) ? "is-revealed" : ""} ${flipping.includes(selected[index].id) ? "is-flipping" : ""}`}
                  onClick={() => phase === "reading" ? revealInPlace(selected[index]) : (!locked && !inFlight && selected.length < MAX_SELECTION && phase === "choosing" && onRemove(selected[index]))}
                  aria-disabled={locked || inFlight || phase === "departing" || (phase === "choosing" && selected.length === MAX_SELECTION) || (phase === "reading" && (revealed.includes(selected[index].id) || flipping.includes(selected[index].id)))}
                  tabIndex={locked || phase === "departing" ? -1 : 0}
                  aria-label={`${position}: ${revealed.includes(selected[index].id) ? `${selected[index].name}. Revealed` : phase === "reading" ? "Face-down card. Tap to reveal" : "Selected card. Remove selection"}`}>
                  <span className="selection-flip-inner" onTransitionEnd={(event) => {
                    if (event.target === event.currentTarget && event.propertyName === "transform" && flipping.includes(selected[index].id)) onRevealComplete(selected[index].id);
                  }}>
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
        inert={locked || phase !== "choosing"}
        onWheel={(event) => {
          if (isMobile || locked || phase !== "choosing") return;
          event.stopPropagation();
          const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
          wheelAccum.current += delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportWidth : 1);
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
                viewportWidth,
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

                  zIndex: isMobile ? index + 1 : cards.length - Math.abs(index - rotationOffset),
                }}
                onClick={(event) =>
                  handleDesktopClick(
                    event,
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
                aria-hidden={fanStyle["--fan-opacity"] === 0 || undefined}
                tabIndex={!locked && phase === "choosing" && index === tabStop ? 0 : -1}
                onFocus={() => {
                  setFocusIndex(index);
                  if (fanStyle["--fan-opacity"] === 0) setRotationOffset(index);
                }}
                aria-disabled={chosen || inFlight}
                aria-label={
                  chosen
                    ? `Face-down card ${index + 1} selected`
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

      {reviewing && <button type="button" className="selection-continue" onClick={onContinue}>See your reading →</button>}

    </section>
  );
}
