import "./IllustratedPanel.css";

/** Code-native ink contour; text remains HTML, colors inherit the current card. */
export default function IllustratedPanel({ children, className = "", ...props }) {
  return <section {...props} className={`illustrated-panel ${className}`}>
    <svg className="illustrated-panel__border" viewBox="0 0 400 400" preserveAspectRatio="none" aria-hidden="true">
      <path className="illustrated-panel__paper" d="M13 7Q120 2 212 8T387 9L394 115 389 248 394 388Q264 397 192 390L9 394 6 270 11 145Z" />
      <path className="illustrated-panel__echo" d="M20 13Q176 8 381 16L386 159 383 382 218 385 17 387 14 223Z" />
      <path className="illustrated-panel__hatch" d="M14 24l13-10m-13 22l23-21m-23 32l31-30M354 387l32-31m-20 32l20-20m-8 21l10-10M10 342l8-8m-8 22l10-10" />
    </svg>
    <div className="illustrated-panel__content">{children}</div>
  </section>;
}
