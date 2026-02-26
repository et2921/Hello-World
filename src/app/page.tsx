import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { VoteGame } from "@/components/VoteGame";
import { CourtBall } from "@/components/CourtBall";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="gamePage">
        <section className="container">
          <div className="hero">
            <h1 className="title">Meme Court</h1>
            <p className="subtitle">Missing Supabase environment variables.</p>
          </div>
        </section>
      </main>
    );
  }

  const [
    {
      data: { session },
    },
    { data: captions },
  ] = await Promise.all([
    supabase.auth.getSession(),
    supabase
      .from("captions")
      .select("id, content, like_count, images(url)")
      .not("content", "is", null)
      .not("image_id", "is", null),
  ]);

  if (!session) {
    redirect("/login?next=/");
  }

  const user = session.user;

  const captionsWithImages = (captions ?? []).filter(
    (c) =>
      c.content &&
      c.images &&
      (c.images as unknown as { url: string }).url
  );

  return (
    <main className="gamePage">
      {/* Decorative court background */}
      <div className="courtDecor" aria-hidden="true" />

      {/* Physics basketball bouncing around the court */}
      <CourtBall />

      <section className="container">
        <div className="hero">
          <div className="userHeader">
            <div>
                <h1 className="title">Meme Court 🏀</h1>
              <p className="subtitle">
                {captionsWithImages.length} memes in the queue — drag to vote
              </p>
            </div>
            <div className="userActions">
              <p className="userInfo">{user!.email ?? "Google user"}</p>
              <Link className="signOutBtn" href="/auth/signout">
                Sign out
              </Link>
            </div>
          </div>
          <div className="pillRow">
            <div className="pill pillActive">Meme Court</div>
            <Link className="pillLink" href="/votes">Scoreboard</Link>
            <Link className="pillLink" href="/admin">Admin</Link>
          </div>
        </div>

        <VoteGame
          captions={captionsWithImages.map((c) => ({
            id: c.id,
            content: c.content as string,
            like_count: c.like_count as number,
            imageUrl: (c.images as unknown as { url: string }).url,
          }))}
          userId={user!.id}
        />
      </section>
    </main>
  );
}
