"use client";

import { useEffect, useRef } from "react";

const SIZE = 44;        // px — ball diameter
const GRAVITY = 0.22;   // downward acceleration per frame
const RESTITUTION = 0.68; // energy kept on bounce (0–1)
const FRICTION = 0.992;   // horizontal damping on floor bounce

export function CourtBall() {
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ball = ballRef.current;
    if (!ball) return;

    // Random starting position and direction
    let x = window.innerWidth * 0.25;
    let y = window.innerHeight * 0.25;
    let vx = 3.2 + Math.random() * 1.5;
    let vy = -3 + Math.random() * -1.5;

    let squishTimer = 0; // frames remaining for squish
    let animId: number;

    function tick() {
      vy += GRAVITY;
      x += vx;
      y += vy;

      const maxX = window.innerWidth - SIZE;
      const maxY = window.innerHeight - SIZE;

      // Wall bounces
      if (x <= 0) {
        x = 0;
        vx = Math.abs(vx) * RESTITUTION;
        squishTimer = 6;
      }
      if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx) * RESTITUTION;
        squishTimer = 6;
      }

      // Ceiling
      if (y <= 0) {
        y = 0;
        vy = Math.abs(vy) * RESTITUTION;
        squishTimer = 6;
      }

      // Floor — main bounce + squish
      if (y >= maxY) {
        y = maxY;
        const speed = Math.abs(vy);
        vy = -speed * RESTITUTION;
        vx *= FRICTION;
        // stop micro-bouncing
        if (speed < 1.2) {
          vy = 0;
          y = maxY;
        }
        squishTimer = 8;
      }

      // Squish transform: wider + shorter on impact
      if (squishTimer > 0) {
        squishTimer--;
        const t = squishTimer / 8;
        ball.style.transform = `translate(${x}px, ${y}px) scaleX(${1 + 0.18 * t}) scaleY(${1 - 0.15 * t})`;
      } else {
        ball.style.transform = `translate(${x}px, ${y}px)`;
      }

      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div ref={ballRef} className="courtBallBounce" aria-hidden="true">
      🏀
    </div>
  );
}
