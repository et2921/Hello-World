import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Humor Flavors</h1>
        <p style={{ color: "crimson" }}>
          Missing Supabase environment variables. Set
          NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.
        </p>
      </main>
    );
  }

  const { data, error } = await supabase.from("humor_flavors").select("*");

  return (
    <main style={{ padding: 24 }}>
      <h1>Humor Flavors</h1>
      {error ? (
        <p style={{ color: "crimson" }}>
          Failed to load data: {error.message}
        </p>
      ) : data && data.length > 0 ? (
        <ul style={{ display: "grid", gap: 12, paddingLeft: 18 }}>
          {data.map((row, index) => (
            <li key={row.id ?? index}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(row, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      ) : (
        <p>No rows found.</p>
      )}
    </main>
  );
}
