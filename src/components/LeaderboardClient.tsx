"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type ScoreboardRow = {
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

export function ScoreboardClient({
  initialLeaderboard,
  captionMap,
}: {
  initialLeaderboard: ScoreboardRow[];
  captionMap: Record<string, CaptionInfo>;
}) {
  const [scoreboard, setScoreboard] = useState<ScoreboardRow[]>(initialLeaderboard);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const rebuild = (votes: { caption_id: string; vote_value: number }[]) => {
      const voteMap: Record<string, { up: number; down: number }> = {};
      for (const vote of votes) {
        const id = vote.caption_id;
        const val = Number(vote.vote_value);
        if (!voteMap[id]) voteMap[id] = { up: 0, down: 0 };
        if (val > 0) voteMap[id].up += val;
        else if (val < 0) voteMap[id].down += Math.abs(val);
      }

      return Object.entries(voteMap)
        .filter(([id]) => captionMap[id] !== undefined)
        .map(([id, { up, down }]) => ({
          id,
          content: captionMap[id].content,
          imageUrl: captionMap[id].imageUrl,
          up,
          down,
          score: up - down,
        }))
        .sort((a, b) => b.score - a.score);
    };

    const refresh = async () => {
      const { data, error } = await supabase
        .from("caption_votes")
        .select("caption_id, vote_value");
      if (error) return;
      setScoreboard(rebuild((data ?? []) as { caption_id: string; vote_value: number }[]));
    };

    const channel = supabase
      .channel("caption_votes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "caption_votes" },
        () => {
          setLiveCount((n) => n + 1);
          void refresh();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [captionMap]);

  return (
    <div className="tableCard">
      <div className="tableHeader">
        <div>Scoreboard</div>
        <div className="liveIndicator">
          <span className="liveDot" />
          Live
          {liveCount > 0 && (
            <span className="liveCount">+{liveCount} new votes</span>
          )}
        </div>
      </div>

      {scoreboard.length === 0 ? (
        <div className="emptyState">No votes yet — start playing!</div>
      ) : (
        <div className="scoreboardGrid">
          {scoreboard.map((row, i) => (
            <div key={row.id} className="scoreboardCard">
              <div className="scoreboardRank">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </div>
              {row.imageUrl ? (
                <img src={row.imageUrl} alt="meme" className="scoreboardImg" />
              ) : (
                <div className="scoreboardImgEmpty">No image</div>
              )}
              <div className="scoreboardInfo">
                <p className="scoreboardCaption">{row.content}</p>
                <p className={`scoreboardPoints ${row.score >= 0 ? "pointsPos" : "pointsNeg"}`}>
                  {row.score > 0 ? "+" : ""}{row.score} pts
                  <span className="scoreboardBreakdown">
                    &nbsp;({row.up} 🏀 / {row.down} 🗑️)
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
