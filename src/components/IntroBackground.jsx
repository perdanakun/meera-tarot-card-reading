import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import "./IntroBackground.css";

import sky from "../assets/background/01_sky.webp";
// Clouds temporarily disabled. Re-enable the layer entry and import to restore.
import far from "../assets/background/03_mountains-far.webp";
import mid from "../assets/background/04_hills-mid.webp";
import foreground from "../assets/background/05_foreground.webp";
import props from "../assets/background/06_props-sheet.webp";

// V5 entrance vocabulary: background .9s/expo.out, props .7s/back.out(1.8).
// Every 1920×1080 export keeps the same registration and scale.
const LAYERS = [
  { name: "sky", src: sky, at: 0, duration: .9, y: 0, ease: "expo.out" },
  { name: "far", src: far, at: .24, duration: .9, y: 18, ease: "power3.out" },
  { name: "mid", src: mid, at: .36, duration: .9, y: 18, ease: "power3.out" },
  { name: "foreground", src: foreground, at: .5, duration: .9, y: 18, ease: "power3.out" },
  { name: "props", src: props, at: 1.05, duration: .7, y: 18, ease: "back.out(1.8)" },
];

export default function IntroBackground({ openingDone, activePortal, reducedMotion, loopVisible, plane = "background" }) {
  const layers = LAYERS.filter(layer => (layer.name === "foreground") === (plane === "foreground"));
  const rootRef = useRef(null);
  const timelineRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    let cancelled = false;
    // Decode independently so images do not pop in halfway through the reveal.
    // This never blocks or modifies the existing intro opening timeline.
    const decoded = Array.from(root.querySelectorAll("img"), image =>
      image.decode().catch(() => {})
    );
    const ctx = gsap.context(() => {
      gsap.set(root.querySelectorAll(".intro-background__layer"), { opacity: 0 });
    }, root);
    Promise.all(decoded).then(() => {
      if (cancelled) return;
      ctx.add(() => {
        const timeline = gsap.timeline({ paused: true });
        layers.forEach(layer => {
          timeline.fromTo(root.querySelector(`[data-layer="${layer.name}"]`), {
            opacity: 0, y: reducedMotion ? 0 : layer.y,
          }, {
            opacity: 1, y: 0,
            duration: reducedMotion ? .22 : layer.duration,
            ease: reducedMotion ? "sine.out" : layer.ease,
          }, reducedMotion ? 0 : layer.at);
        });
        timelineRef.current = timeline;
        // Read current visibility, including changes while images decoded.
        if (root.dataset.paused !== "true") timeline.play();
      });
    });
    return () => { cancelled = true; timelineRef.current = null; ctx.revert(); };
  }, [reducedMotion, plane]);

  useLayoutEffect(() => {
    const timeline = timelineRef.current;
    if (activePortal || !loopVisible) timeline?.pause();
    else timeline?.resume();
  }, [activePortal, loopVisible]);

  // Only clouds and the supplied props sheet respond to a fine pointer.
  // Inner wrappers keep pointer motion separate from entrance transforms.
  useEffect(() => {
    if (plane === "foreground" || !openingDone || activePortal || reducedMotion || !loopVisible) return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      cleanup = () => {};
      if (!media.matches) return;
      let move;
      let reset;
      const ctx = gsap.context(() => {
        const controls = Array.from(rootRef.current.querySelectorAll("[data-parallax]"), node => ({
          depth: Number(node.dataset.parallax),
          x: gsap.quickTo(node, "x", { duration: .8, ease: "power3.out" }),
          y: gsap.quickTo(node, "y", { duration: .8, ease: "power3.out" }),
        }));
        move = event => {
          if (event.pointerType === "touch") return;
          const x = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
          const y = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
          controls.forEach(c => { c.x(x * c.depth); c.y(y * c.depth); });
        };
        reset = () => controls.forEach(c => { c.x(0); c.y(0); });
      }, rootRef);
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", reset);
      window.addEventListener("blur", reset);
      cleanup = () => {
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", reset);
        window.removeEventListener("blur", reset);
        ctx.revert();
      };
    };
    setup();
    media.addEventListener("change", setup);
    return () => { media.removeEventListener("change", setup); cleanup(); };
  }, [openingDone, activePortal, reducedMotion, loopVisible, plane]);

  return (
    <div ref={rootRef} className={`intro-background intro-background--${plane}`} aria-hidden="true"
      data-paused={activePortal || !loopVisible}>
      <div className="intro-background__stage">
        {layers.map((layer, index) => (
          <div key={layer.name} className="intro-background__layer"
            data-layer={layer.name} style={{ zIndex: Math.min(index, 4) }}>
            <div className="intro-background__motion"
              data-parallax={layer.name === "clouds" ? 8 : layer.name === "props" ? 28 : undefined}>
            <img src={layer.src} alt="" draggable={false} decoding="async"
              width="1920" height="1080" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
