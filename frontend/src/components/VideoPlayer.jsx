import { useEffect, useRef } from "react";
import { isVideoFile, toEmbedUrl } from "../utils/contentFormat.js";

/**
 * The experiment video: a native player for video files (for example the app's own /videos/… files),
 * otherwise an embedded player (YouTube and similar links). `className` sizes it inside its 16:9 wrapper.
 * When `active` becomes false (the student moved to another section), a playing video is paused and an
 * embedded player is removed, so nothing keeps playing out of sight.
 */
export default function VideoPlayer({ url, className, active = true }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (!active) videoRef.current?.pause();
  }, [active]);

  if (isVideoFile(url)) {
    return (
      <video ref={videoRef} className={className} src={url} controls preload="metadata" playsInline>
        Your browser cannot play this video.
      </video>
    );
  }
  if (!active) return null;
  return (
    <iframe
      className={className}
      src={toEmbedUrl(url)}
      title="Experiment video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
