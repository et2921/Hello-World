"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_ID = "DkSC_2ZMFb0";

export function MusicPlayer() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const playerEl = document.createElement("div");
    containerRef.current?.appendChild(playerEl);

    function initPlayer() {
      playerRef.current = new w.YT.Player(playerEl, {
        width: "1",
        height: "1",
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: VIDEO_ID,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: () => setReady(true),
          onStateChange: (event: { data: number }) => {
            setPlaying(event.data === 1); // 1 = YT.PlayerState.PLAYING
          },
        },
      });
    }

    if (w.YT?.Player) {
      initPlayer();
    } else {
      const prev = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      playerRef.current?.destroy?.();
      playerEl.remove();
    };
  }, []);

  function toggle() {
    if (!ready || !playerRef.current) return;
    if (playing) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  return (
    <>
      {/* YouTube iframe lives here — 1×1px, invisible, required for the API */}
      <div
        ref={containerRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
          bottom: 0,
          right: 0,
        }}
      />

      {/* Floating play/pause button */}
      <button
        className={`musicBtn${playing ? " musicBtnPlaying" : ""}`}
        onClick={toggle}
        aria-label={playing ? "Pause music" : "Play music"}
        title={playing ? "Pause music" : "Play music"}
        disabled={!ready}
      >
        {playing ? "⏸" : "🎵"}
      </button>
    </>
  );
}
