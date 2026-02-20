"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type Caption = {
  id: string;
  content: string;
  like_count: number;
  imageUrl: string;
};

type VoteState = "idle" | "loading" | "up" | "down" | "error";

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
      setVoteStates((prev) => ({
        ...prev,
        [captionId]: voteValue === 1 ? "up" : "down",
      }));
    }
  }

  if (captions.length === 0) {
    return <div className="emptyState">No memes found.</div>;
  }

  return (
    <div className="memeGrid">
      {captions.map((caption) => {
        const state = voteStates[caption.id] ?? "idle";
        const errMsg = errorMessages[caption.id];

        return (
          <div key={caption.id} className="memeCard">
            <img
              src={caption.imageUrl}
              alt="meme"
              className="memeImg"
            />
            <div className="memeBody">
              <p className="memeCaption">{caption.content}</p>
              <div className="memeVoteRow">
                {state === "up" || state === "down" ? (
                  <span className={state === "up" ? "voteSuccess" : "voteDownFeedback"}>
                    {state === "up" ? "▲ Upvoted!" : "▼ Downvoted!"}
                  </span>
                ) : state === "error" ? (
                  <span className="voteError">{errMsg || "Error submitting vote."}</span>
                ) : (
                  <>
                    <button
                      className="voteBtn voteUp"
                      onClick={() => handleVote(caption.id, 1)}
                      disabled={state === "loading"}
                      aria-label="Upvote"
                    >
                      ▲ Up
                    </button>
                    <button
                      className="voteBtn voteDown"
                      onClick={() => handleVote(caption.id, -1)}
                      disabled={state === "loading"}
                      aria-label="Downvote"
                    >
                      ▼ Down
                    </button>
                    {state === "loading" && (
                      <span className="voteLoading">Saving…</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
