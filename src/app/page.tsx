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
            <div className="eyebrow">SUPABASE -&gt; NEXT.JS</div>
            <h1 className="title">Meme Vote</h1>
            <p className="subtitle">
              Missing Supabase environment variables. Set
              NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
              Vercel.
            </p>
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
    redirect("/login");
  }

  const captionsWithImages = (captions ?? []).filter(
    (c) => c.images && (c.images as unknown as { url: string }).url
  );

  return (
    <main className="page">
      <section className="container">
        <div className="hero">
          <div className="tableHeader userHeader">
            <div>
              <div className="eyebrow">SUPABASE -&gt; NEXT.JS</div>
              <h1 className="title">Meme Vote</h1>
              <p className="subtitle">
                {captionsWithImages.length} memes | Vote on your favourites
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
            <div className="pill pillActive">Memes</div>
            <Link className="pillLink" href="/votes">
              Vote Results
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
