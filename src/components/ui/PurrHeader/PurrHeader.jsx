
import "./PurrHeader.css";

function SlaveArrow() {
  return (
    <svg className="purr-header__icon purr-header__arrow" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M7 24C13 23 15 20 18 16L25 7M14 8C18 7 22 7 25 7C25 11 25 14 24 18" />
    </svg>
  );
}

function CardsDoodle() {
  return (
    <svg className="purr-header__icon purr-header__cards" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      <path d="M12 8L7 10Q5 10 6 13L10 29Q10 31 13 30L18 28M14 5Q13 5 13 8L15 27Q15 29 18 29L30 27Q32 27 31 24L29 6Q29 4 26 4Z" />
      <path d="M22 11L23.5 15.5L28 17L24 19L23 24L21 20L17 18L21 16Z" />
    </svg>
  );
}

/** Transparent navigation; the parent controls when it is visible.
 * Pass CardsLink={Link} when the app uses react-router-dom.
 * cardsHref can include the hosting prefix, e.g. /purranormal/tarot-cards.
 */
export default function PurrHeader({
  visible = true,
  cardsHref = "/tarot-cards",
  slaveHref = "https://perdanakun.com",
  cardsActive = false,
  CardsLink = "a",
  onCardsClick,
  className = "",
}) {
  const cardsDestination = CardsLink === "a"
    ? { href: cardsHref }
    : { to: cardsHref };

  return (
    <header className={`purr-header ${className}`.trim()} hidden={!visible}>
      <nav className="purr-header__nav" aria-label="Purranormal navigation">
        <a className="purr-header__link purr-header__link--slave" href={slaveHref}>
          <span className="purr-header__label">my slave</span>
          <SlaveArrow />
        </a>
        <CardsLink
          {...cardsDestination}
          className="purr-header__link purr-header__link--cards"
          aria-current={cardsActive ? "page" : undefined}
          onClick={onCardsClick}
        >
          <CardsDoodle />
          <span className="purr-header__label">cards</span>
        </CardsLink>
      </nav>
    </header>
  );
}