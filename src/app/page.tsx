import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return (
      <main className="page">
        <section className="container">
          <div className="hero">
            <div className="eyebrow">SUPABASE -&gt; NEXT.JS</div>
            <h1 className="title">Humor Flavors</h1>
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
    { data, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("humor_flavors").select("id, slug, description").order("id"),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page">
      <section className="container">
        <div className="hero">
          <div className="tableHeader userHeader">
            <div>
              <div className="eyebrow">SUPABASE -&gt; NEXT.JS</div>
              <h1 className="title">Humor Flavors</h1>
              <p className="subtitle">
                {data ? data.length : 0} rows | Table: humor_flavors
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
            <div className="pill">ID | Slug | Description</div>
            <div className="pill">Protected route</div>
          </div>
        </div>

        <div className="tableCard">
          <div className="tableHeader">
            <div>Humor Flavors</div>
            <div>{data ? `Showing ${data.length}` : "Showing 0"}</div>
          </div>
          {error ? (
            <div className="errorState">Failed to load data: {error.message}</div>
          ) : data && data.length > 0 ? (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>id</th>
                    <th>slug</th>
                    <th>description</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.slug}</td>
                      <td>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="emptyState">No rows found.</div>
          )}
        </div>
      </section>
    </main>
  );
}
