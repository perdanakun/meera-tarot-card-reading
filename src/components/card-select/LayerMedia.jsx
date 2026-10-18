import { useEffect, useRef, useState } from "react";
import fallbackCat from "../../assets/background/cat_hero-04-04.svg";

/** Image and video always fill the exact same registered full-canvas box. */
export default function LayerMedia({ src, webm, mov, selected, visible, reducedMotion, className = "", alt = "", onUnavailable }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const useVideo = Boolean((webm || mov) && !reducedMotion && !failed);
  useEffect(() => { setFailed(false); setReady(false); }, [webm, mov]);
  useEffect(() => {
    const video = ref.current;
    if (!video || !useVideo) return;
    if (selected && visible) {
      const playback = video.play();
      playback?.catch(() => { setFailed(true); });
    } else video.pause();
    return () => video.pause();
  }, [useVideo, selected, visible]);
  return (
    <div className={`card-layer-media ${className}`}>
      <img src={src} decoding="async" alt={alt} draggable={false}
        style={{ opacity: useVideo && ready ? 0 : 1 }} onError={(event) => {
          if (!event.currentTarget.src.endsWith(fallbackCat)) event.currentTarget.src = fallbackCat;
          onUnavailable?.();
        }} />
      {useVideo && (
        <video ref={ref} muted loop playsInline autoPlay={selected && visible} preload="auto" poster={src}
          aria-hidden="true" style={{ opacity: ready ? 1 : 0 }}
          onLoadedData={() => setReady(true)} onError={() => { setFailed(true); setReady(false); }}>
          {/* Safari alpha video needs a correctly encoded HEVC-with-alpha MOV.
              Put main.mov here alongside main.webm. MOV first lets Safari choose HEVC;
              unsupported browsers skip it and use VP9 WEBM. Test actual encodings. */}
          {mov && <source src={mov} type='video/quicktime; codecs="hvc1"' />}
          {webm && <source src={webm} type="video/webm" />}
        </video>
      )}
    </div>
  );
}
