"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type LeaderboardRow = {
  id: string;
  content: string;
  imageUrl: string | null;
  up: number;
  down: number;
  score: number;
};

type CaptionInfo = {
  content: string;
  imageUrl: string | null;
};

export function LeaderboardClient({
  initialLeaderboard,
  captionMap,
}: {
  initialLeaderboard: LeaderboardRow[];
  captionMap: Record<string, CaptionInfo>;
}) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>(initialLeaderboard);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("caption_votes_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "caption_votes" },
        (payload: { new: Record<string, unknown> }) => {
          const { caption_id, vote_value } = payload.new as {
            caption_id: string;
            vote_value: number;
          };

          setLiveCount((n) => n + 1);
          setLeaderboard((prev) => {
            const existing = prev.find((r) => r.id === caption_id);
            let updated: LeaderboardRow[];

            if (existing) {
              updated = prev.map((r) => {
                if (r.id !== caption_id) return r;
                const up = vote_value > 0 ? r.up + vote_value : r.up;
                const down = vote_value < 0 ? r.down + Math.abs(vote_value) : r.down;
                return { ...r, up, down, score: up - down };
              });
            } else {
              const info = captionMap[caption_id];
              if (info) {
                const up = vote_value > 0 ? vote_value : 0;
                const down = vote_value < 0 ? Math.abs(vote_value) : 0;
                updated = [
                  ...prev,
                  { id: caption_id, content: info.content, imageUrl: info.imageUrl, up, down, score: up - down },
                ];
              } else {
                updated = prev;
              }
            }

            return [...updated].sort((a, b) => b.score - a.score);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [captionMap]);

  return (
    <div className="tableCard">
      <div className="tableHeader">
        <div>Leaderboard</div>
        <div className="liveIndicator">
          <span className="liveDot" />
          Live
          {liveCount > 0 && (
            <span className="liveCount">+{liveCount} since page load</span>
          )}
        </div>
      </div>
      {leaderboard.length === 0 ? (
        <div className="emptyState">No votes yet.</div>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>meme</th>
                <th>caption</th>
                <th>▲ up</th>
                <th>▼ down</th>
                <th>score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={row.id}>
                  <td>{i + 1}</td>
                  <td>
                    {row.imageUrl ? (
                      <img src={row.imageUrl} alt="meme" className="leaderboardThumb" />
                    ) : (
                      <span className="noThumb">—</span>
                    )}
                  </td>
                  <td>{row.content}</td>
                  <td className="voteUpCount">{row.up}</td>
                  <td className="voteDownCount">{row.down}</td>
                  <td className={row.score >= 0 ? "voteUpCount" : "voteDownCount"}>
                    {row.score > 0 ? "+" : ""}
                    {row.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
