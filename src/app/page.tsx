import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function Home() {
  const supabase = createSupabaseServerClient();
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
