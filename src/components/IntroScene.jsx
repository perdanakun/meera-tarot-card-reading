import { ArrowRight } from "lucide-react";
import { TarotCardView } from "./TarotCard";
import "./IntroScene.css";

function CatEyeSigil() {
  return (
    <svg
      className="intro-sigil"
      viewBox="0 0 92 48"
      aria-hidden="true"
    >
      <path
        d="M7 24C18 10 31 5 46 5s28 5 39 19C74 38 61 43 46 43S18 38 7 24Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M41 14c3-4 7-4 10 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <ellipse
        cx="46"
        cy="24"
        rx="8"
        ry="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M46 17v14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M24 8l4-6 4 6M60 8l4-6 4 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PawDoodle() {
  return (
    <svg
      viewBox="0 0 54 54"
      aria-hidden="true"
    >
      <ellipse
        cx="27"
        cy="33"
        rx="11"
        ry="9"
      />

      <ellipse
        cx="15"
        cy="21"
        rx="4"
        ry="6"
      />

      <ellipse
        cx="25"
        cy="15"
        rx="4"
        ry="6"
      />

      <ellipse
        cx="36"
        cy="18"
        rx="4"
        ry="6"
      />

      <ellipse
        cx="42"
        cy="28"
        rx="4"
        ry="6"
      />
    </svg>
  );
}

function FishDoodle() {
  return (
    <svg
      viewBox="0 0 70 36"
      aria-hidden="true"
    >
      <path
        d="M8 18c10-11 24-11 34 0-10 11-24 11-34 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M42 18 58 7v22L42 18Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="19"
        cy="16"
        r="1.6"
        fill="currentColor"
      />

      <path
        d="M28 10v16M34 9v18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function IntroScene({
  deck,
  entering,
  onBegin,
}) {
  const floating =
    deck.slice(0, 6);

  return (
    <section
      className={`meera-intro ${
        entering
          ? "is-entering"
          : ""
      }`}
      aria-labelledby="intro-title"
    >
      <div
        className="meera-hero-frame meera-intro__hero-frame"
        aria-hidden="true"
      >
        <span className="meera-frame-corner meera-frame-corner--tl">
          ✦
        </span>

        <span className="meera-frame-corner meera-frame-corner--tr">
          ☾
        </span>

        <span className="meera-frame-corner meera-frame-corner--bl">
          ☽
        </span>

        <span className="meera-frame-corner meera-frame-corner--br">
          ✦
        </span>
      </div>

      <div
        className="meera-intro__orbit"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>

      <div
        className="meera-intro__ornaments"
        aria-hidden="true"
      >
        <span className="intro-ornament intro-ornament--star-a">
          ✦
        </span>

        <span className="intro-ornament intro-ornament--star-b">
          ✧
        </span>

        <span className="intro-ornament intro-ornament--moon-a">
          ☾
        </span>

        <span className="intro-ornament intro-ornament--moon-b">
          ☽
        </span>

        <span className="intro-ornament intro-ornament--dots-a">
          · · ·
        </span>

        <span className="intro-ornament intro-ornament--dots-b">
          · · ·
        </span>

        <span className="intro-ornament intro-ornament--paw">
          <PawDoodle />
        </span>

        <span className="intro-ornament intro-ornament--fish">
          <FishDoodle />
        </span>
      </div>

      <div
        className="meera-intro__cards"
        aria-hidden="true"
      >
        {floating.map(
          (card, index) => (
            <div
              key={card.id}
              className={`meera-intro__card meera-intro__card--${index}`}
            >
              <div className="meera-intro__flip-card">
                <div className="meera-intro__flip-inner">
                  <div className="meera-intro__flip-face meera-intro__flip-face--back">
                    <TarotCardView
                      card={card}
                      compact
                    />
                  </div>

                  <div className="meera-intro__flip-face meera-intro__flip-face--front">
                    <TarotCardView
                      card={card}
                      faceUp
                      compact
                    />
                  </div>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="meera-intro__content">
        <div className="meera-intro__sigil-wrap">
          <span className="meera-star meera-star--sm" />

          <CatEyeSigil />

          <span className="meera-star meera-star--sm" />
        </div>

        <p className="meera-eyebrow">
          A reflective card ritual
        </p>

        <h1
          id="intro-title"
          className="meera-display-xl meera-intro__title"
        >
          A little space
          <br />

          <em className="meera-emphasis">
            to listen to yourself.
          </em>
        </h1>

        <div
          className="meera-divider meera-intro__divider"
          aria-hidden="true"
        >
          <i className="meera-divider__symbol" />
        </div>

        <div className="meera-intro__actions">
          <p className="meera-body meera-intro__description">
            Not a prediction. A pause.
            <br />
            A place to notice what is
            already there.
          </p>

          <button
            type="button"
            className="meera-button meera-intro__cta"
            onClick={onBegin}
            disabled={entering}
          >
            <span>Begin</span>

            <span className="meera-button__icon">
              <ArrowRight
                size={15}
                strokeWidth={2}
              />
            </span>
          </button>

          <p className="meera-micro meera-intro__microcopy">
            Pick three cards · trust the first pull
          </p>
        </div>
      </div>

      <div
        className="meera-intro__footer-mark"
        aria-hidden="true"
      >
        <span>✦</span>
        <i />
        <span>☾</span>
        <i />
        <span>✦</span>
      </div>

      {entering && (
        <div
          className="meera-intro__transition"
          aria-label="Entering the card space"
        >
          <span className="intro-transition-ring intro-transition-ring--1" />
          <span className="intro-transition-ring intro-transition-ring--2" />
          <span className="intro-transition-ring intro-transition-ring--3" />

          <div className="meera-intro__transition-copy">
            <span>✦</span>
            <p>Take a breath.</p>
            <span>☾</span>
          </div>
        </div>
      )}
    </section>
  );
}