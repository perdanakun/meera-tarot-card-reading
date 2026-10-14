import { useEffect, useRef, useState } from "react";
import "./SpiralTransition.css";

// Six walking-cat frames. Keep filenames aligned with src/assets/background/.
import frame01 from "../assets/background/cat walking_0.svg";
import frame02 from "../assets/background/cat walking_1.svg";
import frame03 from "../assets/background/cat walking_2.svg";
import frame04 from "../assets/background/cat walking_3.svg";
import frame05 from "../assets/background/cat walking_4.svg";
import frame06 from "../assets/background/cat walking_5.svg";

const FRAMES = [frame01, frame02, frame03, frame04, frame05, frame06];
const FRAME_MS = 130; // ~7.7 FPS; increase for slower hand-drawn motion.

export default function SpiralTransition({
  onComplete,
  duration = 6000,
  reducedMotion = false,
}) {
  const callbackRef = useRef(onComplete);
  const completedRef = useRef(false);
  const [frame, setFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const [systemReducedMotion, setSystemReducedMotion] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    callbackRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  const still = reducedMotion || systemReducedMotion;

  useEffect(() => {
    if (still) return;
    const interval = window.setInterval(() => {
      setFrame((current) => (current + 1) % FRAMES.length);
    }, FRAME_MS);
    return () => window.clearInterval(interval);
  }, [still]);

  useEffect(() => {
    if (still) {
      setProgress(100);
      return;
    }
    const start = performance.now();
    let raf;
    const update = (now) => {
      const fraction = Math.min(1, (now - start) / Math.max(1, duration));
      setProgress((previous) => {
        const next = Math.round(fraction * 100);
        return previous === next ? previous : next;
      });
      if (fraction < 1) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [duration, still]);

  useEffect(() => {
    if (typeof onComplete !== "function") return;
    const delay = still ? Math.min(100, Math.max(0, duration)) : Math.max(0, duration);
    const timer = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      callbackRef.current?.();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [duration, still, onComplete]);

  return (
    <div
      className="meera-spiral-transition"
      role="status"
      aria-live="polite"
      aria-label="Preparing your card reading"
    >
      <div className="meera-loading__center">
        <div className="meera-loading__cat" aria-hidden="true">
          {/* The SVG frames are swapped instantly, with no crossfade. */}
          <img src={FRAMES[still ? 0 : frame]} alt="" draggable={false} />
        </div>
        <div
          className="meera-loading__progress"
          role="progressbar"
          aria-label="Loading cards"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="meera-loading__progress-track">
            <div
              className="meera-loading__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="meera-loading__progress-number">{progress}%</span>
        </div>
        <p className="meera-loading__caption">
          a little journey<span className="meera-loading__dots" aria-hidden="true">...</span>
        </p>
      </div>
    </div>
  );
}