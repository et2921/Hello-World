import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleLoginButton } from "@/components/google-login-button";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/");
    }
  }

  return (
    <main className="page">
      <section className="container">
        <div className="hero loginHero">
          <div className="eyebrow">Assignment #5</div>
          <h1 className="title">Sign in</h1>
          <p className="subtitle">
            Sign in with Google to vote on memes and view the leaderboard.
          </p>
          <div className="loginActions">
            <GoogleLoginButton />
            <Link className="homeLink" href="/">
              ← Home
            </Link>
          </div>
          <div className="redirectInfo">Redirect URI is /auth/callback</div>
        </div>
      </section>
    </main>
  );
}
