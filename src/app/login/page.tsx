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
          <div className="eyebrow">Protected App</div>
          <h1 className="title">Sign in to view Humor Flavors</h1>
          <p className="subtitle">
            Use Google OAuth to access the protected table page.
          </p>
          <GoogleLoginButton />
        </div>
      </section>
    </main>
  );
}
