import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { AdminPanel } from "@/components/AdminPanel";
import { UploadPanel } from "@/components/UploadPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="page">
        <section className="container">
          <p className="subtitle">Missing Supabase environment variables.</p>
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  // Restrict admin to @columbia.edu emails only
  if (!user.email?.endsWith("@columbia.edu")) {
    return (
      <main className="page">
        <section className="container">
          <div className="hero">
            <h1 className="title">Access Denied</h1>
            <p className="subtitle">
              Admin is only available to @columbia.edu accounts.
              <br />
              You are signed in as <strong>{user.email}</strong>.
            </p>
            <div className="pillRow">
              <Link className="pillLink" href="/">← Meme Court</Link>
              <Link className="pillLink" href="/auth/signout">Sign out</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { data: captions } = await supabase
    .from("captions")
    .select("id, content, like_count, images(url)")
    .not("content", "is", null);

  return (
    <main className="page">
      <section className="container">
        <div className="hero">
          <div className="userHeader">
            <div>
              <div className="eyebrow">Admin</div>
              <h1 className="title">Manage Memes</h1>
              <p className="subtitle">
                {captions?.length ?? 0} memes in the database
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
            <Link className="pillLink" href="/">
              ← Meme Court
            </Link>
            <Link className="pillLink" href="/votes">
              Scoreboard
            </Link>
            <div className="pill pillActive">Admin</div>
          </div>
        </div>

        <UploadPanel />

        <AdminPanel
          initialCaptions={(captions ?? []).map((c) => ({
            id: c.id,
            content: c.content as string,
            like_count: c.like_count as number,
            imageUrl: c.images
              ? (c.images as unknown as { url: string }).url
              : null,
          }))}
        />
      </section>
    </main>
  );
}
