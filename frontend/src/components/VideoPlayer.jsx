import { useEffect, useRef, useState } from "react";
import { isVideoFile, toEmbedUrl } from "../utils/contentFormat.js";
import "./VideoPlayer.css";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SPEED_KEY = "ml-lab:video-speed";
const QUALITY_KEY = "ml-lab:video-quality";

/** The lighter copy of an app video sits next to it: /videos/name.mp4 → /videos/name-480p.mp4 (else null). */
export function lightVersionUrl(url) {
  if (!url || !url.startsWith("/") || !/\.mp4$/i.test(url)) return null;
  return url.replace(/\.mp4$/i, "-480p.mp4");
}

// Speed and quality are per-viewer conveniences; the player works the same without storage.
function readPref(key, fallback) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function savePref(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
}

/**
 * The experiment video: a native player for video files (for example the app's own /videos/… files),
 * otherwise an embedded player (YouTube and similar links). `className` sizes the player; `frameClassName`
 * (optional) wraps it in a 16:9 frame so the controls below it stay outside the frame.
 * Video files get a Speed choice and, when a lighter "-480p" copy exists, a Quality choice
 * (HD or Data saver); switching quality keeps the position.
 * When `active` becomes false (the student moved to another section), a playing video is paused and an
 * embedded player is removed, so nothing keeps playing out of sight.
 */
export default function VideoPlayer({ url, className, frameClassName, active = true }) {
  const videoRef = useRef(null);
  const resumeAt = useRef(null); // position (and play state) to restore after a quality switch
  const lightUrl = lightVersionUrl(url);
  const [hasLight, setHasLight] = useState(false);
  const [quality, setQuality] = useState(() => readPref(QUALITY_KEY, "hd"));
  const [speed, setSpeed] = useState(() => {
    const saved = Number(readPref(SPEED_KEY, "1"));
    return SPEEDS.includes(saved) ? saved : 1;
  });

  useEffect(() => {
    if (!active) videoRef.current?.pause();
  }, [active]);

  // Offer Data saver only when the server really has the file: a missing file would come back as the app page.
  useEffect(() => {
    setHasLight(false);
    if (!lightUrl) return undefined;
    let live = true;
    fetch(lightUrl, { method: "HEAD" })
      .then((r) => {
        if (live) setHasLight(r.ok && (r.headers.get("content-type") || "").startsWith("video/"));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [lightUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const frame = (child) => (frameClassName ? <div className={frameClassName}>{child}</div> : child);

  if (!isVideoFile(url)) {
    if (!active) return null;
    return frame(
      <iframe
        className={className}
        src={toEmbedUrl(url)}
        title="Experiment video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />,
    );
  }

  const src = hasLight && quality === "light" ? lightUrl : url;

  function changeQuality(next) {
    const v = videoRef.current;
    if (v) resumeAt.current = { time: v.currentTime, play: !v.paused };
    setQuality(next);
    savePref(QUALITY_KEY, next);
  }

  function changeSpeed(next) {
    setSpeed(next);
    savePref(SPEED_KEY, String(next));
  }

  function handleLoaded() {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    if (resumeAt.current) {
      v.currentTime = resumeAt.current.time;
      if (resumeAt.current.play) v.play().catch(() => {});
      resumeAt.current = null;
    }
  }

  return (
    <div className="video-player">
      {frame(
        <video
          ref={videoRef}
          className={className}
          src={src}
          controls
          preload="metadata"
          playsInline
          onLoadedMetadata={handleLoaded}
        >
          Your browser cannot play this video.
        </video>,
      )}
      <div className="video-player__tools">
        <label className="video-player__control">
          <span>Speed</span>
          <select className="form-select" value={speed} onChange={(e) => changeSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s === 1 ? "Normal" : `${s}×`}
              </option>
            ))}
          </select>
        </label>
        {hasLight && (
          <label className="video-player__control">
            <span>Quality</span>
            <select className="form-select" value={quality === "light" ? "light" : "hd"} onChange={(e) => changeQuality(e.target.value)}>
              <option value="hd">HD (1080p)</option>
              <option value="light">Data saver (480p)</option>
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
