import "../PurrHeader/PurrHeader.css";
import "./PurrButton.css";

/** Shared hand-ink control, using the same contour language as PurrHeader. */
export default function PurrButton({ children, className = "", ...props }) {
  return <button type="button" {...props} className={`purr-header__link purr-control ${className}`.trim()}><span className="purr-control__label">{children}</span></button>;
}
