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
  const columns =
    data && data.length > 0 ? Object.keys(data[0] as Record<string, unknown>) : [];

  return (
    <main style={{ padding: 24 }}>
      <h1>Humor Flavors</h1>
      {error ? (
        <p style={{ color: "crimson" }}>
          Failed to load data: {error.message}
        </p>
      ) : data && data.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: 600,
            }}
          >
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      borderBottom: "2px solid #ddd",
                      padding: "8px 10px",
                      fontWeight: 600,
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={(row as { id?: number | string }).id ?? index}>
                  {columns.map((col) => (
                    <td
                      key={`${index}-${col}`}
                      style={{
                        borderBottom: "1px solid #eee",
                        padding: "8px 10px",
                        verticalAlign: "top",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {row[col] === null || row[col] === undefined
                        ? ""
                        : typeof row[col] === "object"
                          ? JSON.stringify(row[col])
                          : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No rows found.</p>
      )}
    </main>
  );
}
