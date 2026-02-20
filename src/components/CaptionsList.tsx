"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type Caption = {
  id: string;
  content: string;
  like_count: number;
};

type VoteState = "idle" | "loading" | "voted" | "error";

export function CaptionsList({
  captions,
  userId,
}: {
  captions: Caption[];
  userId: string;
}) {
  const [voteStates, setVoteStates] = useState<Record<string, VoteState>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  async function handleVote(captionId: string, voteValue: 1 | -1) {
    setVoteStates((prev) => ({ ...prev, [captionId]: "loading" }));

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setVoteStates((prev) => ({ ...prev, [captionId]: "error" }));
      setErrorMessages((prev) => ({
        ...prev,
        [captionId]: "Supabase not available.",
      }));
      return;
    }

    const { error } = await supabase.from("caption_votes").insert({
      vote_value: voteValue,
      profile_id: userId,
      caption_id: captionId,
    });

    if (error) {
      setVoteStates((prev) => ({ ...prev, [captionId]: "error" }));
      setErrorMessages((prev) => ({ ...prev, [captionId]: error.message }));
    } else {
      setVoteStates((prev) => ({ ...prev, [captionId]: "voted" }));
    }
  }

  return (
    <div className="tableCard">
      <div className="tableHeader">
        <div>Captions</div>
        <div>{captions.length > 0 ? `Showing ${captions.length}` : "Showing 0"}</div>
      </div>
      {captions.length === 0 ? (
        <div className="emptyState">No captions found.</div>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>caption</th>
                <th>score</th>
                <th>vote</th>
              </tr>
            </thead>
            <tbody>
              {captions.map((caption) => {
                const state = voteStates[caption.id] ?? "idle";
                const errMsg = errorMessages[caption.id];
                return (
                  <tr key={caption.id}>
                    <td>{caption.content}</td>
                    <td>{caption.like_count}</td>
                    <td>
                      {state === "voted" ? (
                        <span className="voteSuccess">Voted!</span>
                      ) : state === "error" ? (
                        <span className="voteError">{errMsg || "Error"}</span>
                      ) : (
                        <div className="voteButtons">
                          <button
                            className="voteBtn voteUp"
                            onClick={() => handleVote(caption.id, 1)}
                            disabled={state === "loading"}
                            aria-label="Upvote"
                          >
                            ▲
                          </button>
                          <button
                            className="voteBtn voteDown"
                            onClick={() => handleVote(caption.id, -1)}
                            disabled={state === "loading"}
                            aria-label="Downvote"
                          >
                            ▼
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
