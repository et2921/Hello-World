import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="page">
        <section className="container">
          <div className="hero">
            <div className="eyebrow">SUPABASE → NEXT.JS</div>
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

  const { data, error } = await supabase.from("humor_flavors").select("*");
  const columns =
    data && data.length > 0 ? Object.keys(data[0] as Record<string, unknown>) : [];

  return (
    <main className="page">
      <section className="container">
        <div className="hero">
          <div className="eyebrow">SUPABASE → NEXT.JS</div>
          <h1 className="title">Humor Flavors</h1>
          <p className="subtitle">
            {data ? data.length : 0} rows • Table: humor_flavors
          </p>
          <div className="pillRow">
            <div className="pill">All columns</div>
            <div className="pill">Live data</div>
          </div>
        </div>

        <div className="tableCard">
          <div className="tableHeader">
            <div>Humor Flavors</div>
            <div>{data ? `Showing ${data.length}` : "Showing 0"}</div>
          </div>
          {error ? (
            <div className="errorState">
              Failed to load data: {error.message}
            </div>
          ) : data && data.length > 0 ? (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={(row as { id?: number | string }).id ?? index}>
                      {columns.map((col) => (
                        <td key={`${index}-${col}`}>
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
            <div className="emptyState">No rows found.</div>
          )}
        </div>
      </section>
    </main>
  );
}
