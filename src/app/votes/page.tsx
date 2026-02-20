import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function VotesPage() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="page">
        <section className="container">
          <div className="hero">
            <div className="eyebrow">SUPABASE -&gt; NEXT.JS</div>
            <h1 className="title">Vote Results</h1>
            <p className="subtitle">Missing Supabase environment variables.</p>
          </div>
        </section>
      </main>
    );
  }

  const [
    {
      data: { user },
    },
    { data: votes },
    { data: captions },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("caption_votes").select("caption_id, vote_value"),
    supabase.from("captions").select("id, content").not("content", "is", null),
  ]);

  if (!user) {
    redirect("/login");
  }

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
  const captionMap: Record<string, string> = {};
  for (const caption of captions ?? []) {
    captionMap[caption.id] = caption.content;
  }

  // Build leaderboard sorted by score
  const leaderboard = Object.entries(voteMap)
    .map(([id, { up, down }]) => ({
      id,
      content: captionMap[id] ?? "(caption not available)",
      up,
      down,
      score: up - down,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <main className="page">
      <section className="container">
        <div className="hero">
          <div className="tableHeader userHeader">
            <div>
              <div className="eyebrow">SUPABASE -&gt; NEXT.JS</div>
              <h1 className="title">Vote Results</h1>
              <p className="subtitle">
                {leaderboard.length} captions voted on
              </p>
            </div>
            <div className="userActions">
              <p className="userInfo">
                Signed in as <span>{user.email ?? "Google user"}</span>
              </p>
              <Link className="pillLink" href="/auth/signout">
                Sign out
              </Link>
            </div>
          </div>
          <div className="pillRow">
            <Link className="pillLink" href="/">
              Captions
            </Link>
            <div className="pill pillActive">Vote Results</div>
          </div>
        </div>

        <div className="tableCard">
          <div className="tableHeader">
            <div>Leaderboard</div>
            <div>
              {leaderboard.length > 0
                ? `Showing ${leaderboard.length}`
                : "Showing 0"}
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
      </section>
    </main>
  );
}
