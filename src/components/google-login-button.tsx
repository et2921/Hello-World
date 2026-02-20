"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleLogin() {
    setErrorMessage("");
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setErrorMessage("Missing Supabase environment variables.");
      setIsLoading(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    if (next.startsWith("/")) {
      document.cookie = `auth_next=${encodeURIComponent(next)}; path=/; max-age=300; SameSite=Lax`;
    }
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="loginActionArea">
      <button className="loginButton" onClick={handleGoogleLogin} disabled={isLoading}>
        {isLoading ? "Redirecting..." : "Continue with Google"}
      </button>
      {errorMessage ? <p className="errorState">{errorMessage}</p> : null}
    </div>
  );
}
