"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

const API_BASE = "https://api.almostcrackd.ai";

type Step =
  | "idle"
  | "presigning"
  | "uploading"
  | "registering"
  | "captioning"
  | "saving"
  | "done"
  | "error";

const STEP_LABELS: Record<string, string> = {
  presigning:  "1. Getting upload URL…",
  uploading:   "2. Uploading image…",
  registering: "3. Registering image…",
  captioning:  "4. Generating captions…",
  saving:      "5. Saving to database…",
};

function extractCaptions(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.map((c) =>
      typeof c === "string" ? c : (c as Record<string, string>).content ?? (c as Record<string, string>).caption ?? JSON.stringify(c)
    );
  }
  const obj = data as Record<string, unknown>;
  const raw = obj.captions ?? obj.results ?? obj.data;
  if (Array.isArray(raw)) return extractCaptions(raw);
  return [];
}

export function UploadPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [captions, setCaptions] = useState<string[]>([]);
  const [savedImageUrl, setSavedImageUrl] = useState("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep("idle");
    setError("");
    setCaptions([]);
    setSavedImageUrl("");
  }

  async function handleUpload() {
    if (!file) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("Supabase unavailable"); setStep("error"); return; }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setError("You must be logged in."); setStep("error"); return; }

    const authHeaders = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      // ── Step 1: Generate presigned URL ──────────────────────────
      setStep("presigning");
      const presignRes = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ contentType: file.type }),
      });
      if (!presignRes.ok) throw new Error(`Presign failed (${presignRes.status}): ${await presignRes.text()}`);
      const { presignedUrl, cdnUrl } = await presignRes.json();

      // ── Step 2: Upload image bytes ───────────────────────────────
      setStep("uploading");
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

      // ── Step 3: Register image with pipeline ─────────────────────
      setStep("registering");
      const registerRes = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      });
      if (!registerRes.ok) throw new Error(`Register failed (${registerRes.status}): ${await registerRes.text()}`);
      const { imageId } = await registerRes.json();

      // ── Step 4: Generate captions ────────────────────────────────
      setStep("captioning");
      const captionRes = await fetch(`${API_BASE}/pipeline/generate-captions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ imageId }),
      });
      if (!captionRes.ok) throw new Error(`Caption generation failed (${captionRes.status}): ${await captionRes.text()}`);
      const captionData = await captionRes.json();
      const captionStrings = extractCaptions(captionData);

      setCaptions(captionStrings);

      // ── Step 5: Save to Supabase ─────────────────────────────────
      setStep("saving");
      const { data: imageRow, error: imgErr } = await supabase
        .from("images")
        .insert({ url: cdnUrl })
        .select("id")
        .single();

      if (imgErr || !imageRow) throw new Error("Failed to save image: " + imgErr?.message);

      setSavedImageUrl(cdnUrl);

      if (captionStrings.length > 0) {
        await supabase.from("captions").insert(
          captionStrings.map((content) => ({
            content,
            image_id: imageRow.id,
            like_count: 0,
          }))
        );
      }

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  }

  function reset() {
    setFile(null);
    setPreview("");
    setStep("idle");
    setError("");
    setCaptions([]);
    setSavedImageUrl("");
  }

  const isRunning = !["idle", "done", "error"].includes(step);

  return (
    <div className="adminCard">
      <h2 className="adminCardTitle">Upload Image → Auto-Generate Captions</h2>

      <div className="adminForm">
        {/* File picker */}
        <label className="adminLabel">Choose Image</label>
        <input
          className="adminInput uploadFileInput"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
          onChange={onFileChange}
          disabled={isRunning}
        />

        {/* Preview */}
        {preview && (
          <img
            src={preview}
            alt="preview"
            className="adminPreview"
            style={{ display: "block" }}
          />
        )}

        {/* Upload button */}
        {file && step === "idle" && (
          <button className="adminSubmitBtn" onClick={handleUpload}>
            Upload &amp; Generate Captions
          </button>
        )}

        {/* Progress steps */}
        {isRunning && (
          <div className="uploadSteps">
            {(["presigning", "uploading", "registering", "captioning", "saving"] as Step[]).map((s) => (
              <div
                key={s}
                className={`uploadStep ${step === s ? "uploadStepActive" : ""} ${
                  (["presigning","uploading","registering","captioning","saving"] as Step[]).indexOf(s) <
                  (["presigning","uploading","registering","captioning","saving"] as Step[]).indexOf(step)
                    ? "uploadStepDone"
                    : ""
                }`}
              >
                {STEP_LABELS[s]}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <>
            <p className="adminMsg adminMsgError">{error}</p>
            <button className="adminSubmitBtn" style={{ background: "rgba(255,255,255,0.1)" }} onClick={reset}>
              Try Again
            </button>
          </>
        )}

        {/* Success */}
        {step === "done" && (
          <>
            <p className="adminMsg adminMsgSuccess">
              Done! {captions.length} caption{captions.length !== 1 ? "s" : ""} generated and saved to the game.
            </p>

            {savedImageUrl && (
              <img src={savedImageUrl} alt="uploaded" className="adminPreview" style={{ display: "block" }} />
            )}

            {captions.length > 0 && (
              <div className="captionResults">
                <p className="adminLabel">Generated Captions</p>
                {captions.map((c, i) => (
                  <div key={i} className="captionResultItem">
                    {i + 1}. {c}
                  </div>
                ))}
              </div>
            )}

            <button className="adminSubmitBtn" onClick={reset}>
              Upload Another
            </button>
          </>
        )}
      </div>
    </div>
  );
}
