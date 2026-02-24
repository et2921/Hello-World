import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ScoreboardClient } from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function ScoreboardPage() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="page">
        <section className="container">
          <div className="hero">
            <div className="eyebrow">Assignment #5</div>
            <h1 className="title">Scoreboard</h1>
            <p className="subtitle">Missing Supabase environment variables.</p>
          </div>
        </section>
      </main>
    );
  }

  const [{ data: { user } }, { data: votes }, { data: captions }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase.from("caption_votes").select("caption_id, vote_value"),
      supabase
        .from("captions")
        .select("id, content, images(url)")
        .not("content", "is", null),
    ]);

  // Require login — session persists automatically after first sign-in
  if (!user) redirect("/login?next=/votes");

  // Aggregate votes per caption
  const voteMap: Record<string, { up: number; down: number }> = {};
  for (const vote of votes ?? []) {
    if (!voteMap[vote.caption_id]) {
      voteMap[vote.caption_id] = { up: 0, down: 0 };
    }
    if (vote.vote_value > 0) {
      voteMap[vote.caption_id].up += vote.vote_value;
    } else {
      voteMap[vote.caption_id].down += Math.abs(vote.vote_value);
    }
  }

  // Map captions by id
  const captionMap: Record<string, { content: string; imageUrl: string | null }> = {};
  for (const caption of captions ?? []) {
    captionMap[caption.id] = {
      content: caption.content as string,
      imageUrl: caption.images
        ? (caption.images as unknown as { url: string }).url
        : null,
    };
  }

  // Build scoreboard sorted by points descending — filter orphaned votes
  const initialScoreboard = Object.entries(voteMap)
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

  return (
    <main className="page">
      <section className="container">
        <div className="hero">
          <div className="userHeader">
            <div>
              <div className="eyebrow">Assignment #5</div>
              <h1 className="title">Scoreboard</h1>
              <p className="subtitle">
                {initialScoreboard.length} memes ranked by points — updates live
              </p>
            </div>
            <div className="userActions">
              <p className="userInfo">{user.email ?? "Google user"}</p>
              <Link className="signOutBtn" href="/auth/signout">
                Sign out
              </Link>
            </div>
          </div>
          <div className="pillRow">
            <Link className="pillLink" href="/">← Meme Court</Link>
            <div className="pill pillActive">Scoreboard</div>
            <Link className="pillLink" href="/admin">Admin</Link>
          </div>
        </div>

        <ScoreboardClient
          initialLeaderboard={initialScoreboard}
          captionMap={captionMap}
        />
      </section>
    </main>
  );
}
