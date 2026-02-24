"use client";

import { useState, useRef, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type Caption = {
  id: string;
  content: string;
  like_count: number;
  imageUrl: string;
};

const THRESHOLD = 100;

export function VoteGame({
  captions,
  userId,
}: {
  captions: Caption[];
  userId: string;
}) {
  const [queue, setQueue] = useState(captions);
  const [isBusy, setIsBusy] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const leftZoneRef = useRef<HTMLDivElement>(null);
  const rightZoneRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);

  // Imperatively update card DOM during drag — avoids React re-render lag
  const applyDrag = useCallback((dx: number, dy: number) => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `translateX(${dx}px) translateY(${dy}px) rotate(${dx * 0.06}deg)`;
    card.style.transition = "none";

    const dunkOp = Math.min(Math.max(dx / THRESHOLD, 0), 1);
    const trashOp = Math.min(Math.max(-dx / THRESHOLD, 0), 1);

    const dunkEl = card.querySelector<HTMLElement>(".cardOverlayDunk");
    const trashEl = card.querySelector<HTMLElement>(".cardOverlayTrash");
    if (dunkEl) dunkEl.style.opacity = String(dunkOp);
    if (trashEl) trashEl.style.opacity = String(trashOp);

    if (leftZoneRef.current)
      leftZoneRef.current.style.opacity = String(0.25 + trashOp * 0.75);
    if (rightZoneRef.current)
      rightZoneRef.current.style.opacity = String(0.25 + dunkOp * 0.75);
  }, []);

  const resetCard = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "translateX(0) translateY(0) rotate(0deg)";
    card.style.transition =
      "transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

    const dunkEl = card.querySelector<HTMLElement>(".cardOverlayDunk");
    const trashEl = card.querySelector<HTMLElement>(".cardOverlayTrash");
    if (dunkEl) dunkEl.style.opacity = "0";
    if (trashEl) trashEl.style.opacity = "0";

    if (leftZoneRef.current) leftZoneRef.current.style.opacity = "0.25";
    if (rightZoneRef.current) rightZoneRef.current.style.opacity = "0.25";
  }, []);

  const flyAndVote = useCallback(
    (direction: "left" | "right") => {
      const card = cardRef.current;
      if (!card || isBusy || queue.length === 0) return;
      setIsBusy(true);
      isDragging.current = false;

      const captionId = queue[0].id;
      const xTarget = direction === "right" ? "140vw" : "-140vw";
      const rot = direction === "right" ? "28deg" : "-28deg";

      card.style.transform = `translateX(${xTarget}) translateY(-20px) rotate(${rot})`;
      card.style.transition =
        "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

      // Fire-and-forget vote insert
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        void supabase.from("caption_votes").insert({
          vote_value: direction === "right" ? 1 : -1,
          profile_id: userId,
          caption_id: captionId,
        });
      }

      setTimeout(() => {
        setQueue((prev) => prev.slice(1));
        setIsBusy(false);
        if (leftZoneRef.current) leftZoneRef.current.style.opacity = "0.25";
        if (rightZoneRef.current) rightZoneRef.current.style.opacity = "0.25";
      }, 420);
    },
    [queue, userId, isBusy]
  );

  // Pointer events handle both mouse and touch in one API
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    applyDrag(e.clientX - startX.current, e.clientY - startY.current);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = e.clientX - startX.current;
    if (dx > THRESHOLD) {
      flyAndVote("right");
    } else if (dx < -THRESHOLD) {
      flyAndVote("left");
    } else {
      resetCard();
    }
  }

  if (queue.length === 0) {
    return (
      <div className="gameComplete">
        <div className="gameCompleteEmoji">🏆</div>
        <h2 className="gameCompleteTitle">All done, MVP!</h2>
        <p className="gameCompleteSubtitle">
          You&apos;ve judged every meme. Check the leaderboard.
        </p>
      </div>
    );
  }

  const current = queue[0];

  return (
    <div className="gameArena">
      {/* Drop zones */}
      <div
        ref={leftZoneRef}
        className="dropZone dropZoneLeft"
        style={{ opacity: 0.25 }}
      >
        <div className="dropZoneIcon">🗑️</div>
        <div className="dropZoneLabel">TRASH IT</div>
      </div>
      <div
        ref={rightZoneRef}
        className="dropZone dropZoneRight"
        style={{ opacity: 0.25 }}
      >
        <div className="dropZoneIcon">🏀</div>
        <div className="dropZoneLabel">DUNK IT</div>
      </div>

      {/* Card stack */}
      <div className="cardStack">
        {/* Shadow cards behind */}
        {queue.slice(1, 3).map((c, i) => (
          <div
            key={c.id}
            className="gameCard gameCardShadow"
            style={{
              transform: `scale(${1 - (i + 1) * 0.05}) translateY(${
                (i + 1) * 14
              }px)`,
              zIndex: 10 - i,
            }}
          />
        ))}

        {/* Active card — "active-" prefix prevents key collision with shadow cards */}
        <div
          key={`active-${current.id}`}
          ref={cardRef}
          className="gameCard"
          style={{ zIndex: 20, cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="cardOverlay cardOverlayDunk" style={{ opacity: 0 }}>
            🏀 DUNK!
          </div>
          <div className="cardOverlay cardOverlayTrash" style={{ opacity: 0 }}>
            🗑️ TRASH!
          </div>
          <img
            src={current.imageUrl}
            alt="meme"
            className="gameCardImg"
            draggable={false}
          />
          <div className="gameCardBody">
            <p className="gameCardCaption">{current.content}</p>
          </div>
        </div>
      </div>

      {/* Hint + counter */}
      <div className="gameHint">
        <span>← trash</span>
        <span className="gameCounter">{queue.length} left</span>
        <span>dunk →</span>
      </div>

      {/* Button fallback */}
      <div className="gameButtons">
        <button
          className="gameBtn gameBtnTrash"
          onClick={() => flyAndVote("left")}
          disabled={isBusy}
        >
          🗑️ Trash
        </button>
        <button
          className="gameBtn gameBtnDunk"
          onClick={() => flyAndVote("right")}
          disabled={isBusy}
        >
          🏀 Dunk
        </button>
      </div>
    </div>
  );
}
