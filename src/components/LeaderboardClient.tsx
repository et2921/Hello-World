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

    const rebuildLeaderboard = (votes: { caption_id: string; vote_value: number }[]) => {
      const voteMap: Record<string, { up: number; down: number }> = {};
      for (const vote of votes) {
        const captionId = vote.caption_id;
        const voteValue = Number(vote.vote_value);

        if (!voteMap[captionId]) {
          voteMap[captionId] = { up: 0, down: 0 };
        }

        if (voteValue > 0) {
          voteMap[captionId].up += voteValue;
        } else if (voteValue < 0) {
          voteMap[captionId].down += Math.abs(voteValue);
        }
      }

      return Object.entries(voteMap)
        .map(([id, { up, down }]) => ({
          id,
          content: captionMap[id]?.content ?? "(caption not available)",
          imageUrl: captionMap[id]?.imageUrl ?? null,
          up,
          down,
          score: up - down,
        }))
        .sort((a, b) => b.score - a.score);
    };

    const refreshLeaderboard = async () => {
      const { data, error } = await supabase
        .from("caption_votes")
        .select("caption_id, vote_value");

      if (error) return;

      setLeaderboard(rebuildLeaderboard((data ?? []) as { caption_id: string; vote_value: number }[]));
    };

    const channel = supabase
      .channel("caption_votes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "caption_votes" },
        () => {
          setLiveCount((n) => n + 1);
          void refreshLeaderboard();
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
