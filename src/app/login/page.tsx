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
    if (user) redirect("/");
  }

  return (
    <main className="courtPage">
      {/* ── Court lines (decorative, aria-hidden) ── */}
      <div className="court" aria-hidden="true">
        <div className="courtBoundary" />
        <div className="courtMidline" />

        {/* Blue paint / keys */}
        <div className="courtKey courtKeyLeft" />
        <div className="courtKey courtKeyRight" />

        {/* Free-throw circles */}
        <div className="courtFT courtFTLeft" />
        <div className="courtFT courtFTRight" />

        {/* Three-point arcs */}
        <div className="courtThreeWrap courtThreeWrapLeft">
          <div className="courtThree" />
        </div>
        <div className="courtThreeWrap courtThreeWrapRight">
          <div className="courtThree" />
        </div>

        {/* Center circle */}
        <div className="courtCenterCircle" />
        <div className="courtJumpDot" />
      </div>

      {/* ── Login card — sits at center court ── */}
      <div className="courtCard">
        <div className="knicksBrand">
          <div className="loginBall">🏀</div>
          <span className="knicksName">Meme Court</span>
        </div>

        <h1 className="courtCardTitle">Sign In</h1>
        <p className="courtCardSub">
          Sign in with Google to vote on memes
        </p>

        <div className="courtCardActions">
          <GoogleLoginButton />
        </div>
      </div>
    </main>
  );
}
