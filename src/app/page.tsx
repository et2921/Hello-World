import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { CaptionsList } from "@/components/CaptionsList";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="page">
        <section className="container">
          <div className="hero">
            <div className="eyebrow">Assignment #5</div>
            <h1 className="title">Meme Vote</h1>
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
    { data: captions },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("captions")
      .select("id, content, like_count, images(url)")
      .not("content", "is", null)
      .not("image_id", "is", null)
      .limit(10),
  ]);

  if (!user) {
    redirect("/login?next=/");
  }

  const captionsWithImages = (captions ?? []).filter(
    (c) => c.images && (c.images as unknown as { url: string }).url
  );

  return (
    <main className="page">
      <section className="container">
        <div className="hero">
          <div className="userHeader">
            <div>
              <div className="eyebrow">Assignment #5</div>
              <h1 className="title">Meme Vote</h1>
              <p className="subtitle">
                {captionsWithImages.length} memes — upvote or downvote your favourites
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
            <div className="pill pillActive">Memes</div>
            <Link className="pillLink" href="/votes">
              Vote Results →
            </Link>
          </div>
        </div>

        <CaptionsList
          captions={captionsWithImages.map((c) => ({
            id: c.id,
            content: c.content as string,
            like_count: c.like_count as number,
            imageUrl: (c.images as unknown as { url: string }).url,
          }))}
          userId={user.id}
        />
      </section>
    </main>
  );
}
