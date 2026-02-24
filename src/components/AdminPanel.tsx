"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type MemeRow = {
  id: string;
  content: string;
  like_count: number;
  imageUrl: string | null;
};

export function AdminPanel({ initialCaptions }: { initialCaptions: MemeRow[] }) {
  const [memes, setMemes] = useState<MemeRow[]>(initialCaptions);
  const [imageUrl, setImageUrl] = useState("");
  const [captionText, setCaptionText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim() || !captionText.trim()) return;

    setStatus("loading");
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Supabase client unavailable.");
      return;
    }

    // 1. Insert the image row
    const { data: imageData, error: imageError } = await supabase
      .from("images")
      .insert({ url: imageUrl.trim() })
      .select("id")
      .single();

    if (imageError || !imageData) {
      setStatus("error");
      setMessage("Image insert failed: " + (imageError?.message ?? "unknown error"));
      return;
    }

    // 2. Insert the caption row linked to the image
    const { data: captionData, error: captionError } = await supabase
      .from("captions")
      .insert({ content: captionText.trim(), image_id: imageData.id, like_count: 0 })
      .select("id, content, like_count")
      .single();

    if (captionError || !captionData) {
      setStatus("error");
      setMessage("Caption insert failed: " + (captionError?.message ?? "unknown error"));
      return;
    }

    const newMeme: MemeRow = {
      id: captionData.id,
      content: captionData.content as string,
      like_count: captionData.like_count as number,
      imageUrl: imageUrl.trim(),
    };

    setMemes((prev) => [newMeme, ...prev]);
    setImageUrl("");
    setCaptionText("");
    setStatus("success");
    setMessage("Meme added successfully!");
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleDelete = async (meme: MemeRow) => {
    setDeletingId(meme.id);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setDeletingId(null); return; }

    const { error } = await supabase.from("captions").delete().eq("id", meme.id);
    if (!error) {
      setMemes((prev) => prev.filter((m) => m.id !== meme.id));
    }
    setDeletingId(null);
  };

  return (
    <div className="adminWrap">
      {/* Add meme form */}
      <div className="adminCard">
        <h2 className="adminCardTitle">Add New Meme</h2>
        <form className="adminForm" onSubmit={handleSubmit}>
          <label className="adminLabel">Image URL</label>
          <input
            className="adminInput"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            required
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="preview"
              className="adminPreview"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              onLoad={(e) => ((e.target as HTMLImageElement).style.display = "block")}
            />
          )}

          <label className="adminLabel">Caption</label>
          <textarea
            className="adminInput adminTextarea"
            placeholder="Write a funny caption..."
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            required
            rows={3}
          />

          <button
            className="adminSubmitBtn"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Saving…" : "Add Meme"}
          </button>

          {status === "success" && (
            <p className="adminMsg adminMsgSuccess">{message}</p>
          )}
          {status === "error" && (
            <p className="adminMsg adminMsgError">{message}</p>
          )}
        </form>
      </div>

      {/* Existing memes list */}
      <div className="adminCard">
        <h2 className="adminCardTitle">Existing Memes ({memes.length})</h2>
        {memes.length === 0 ? (
          <p className="adminEmpty">No memes yet. Add one above.</p>
        ) : (
          <div className="adminMemeList">
            {memes.map((meme) => (
              <div key={meme.id} className="adminMemeRow">
                {meme.imageUrl ? (
                  <img src={meme.imageUrl} alt="meme" className="adminThumb" />
                ) : (
                  <div className="adminThumbEmpty">No image</div>
                )}
                <div className="adminMemeInfo">
                  <p className="adminMemeCaption">{meme.content}</p>
                  <p className="adminMemeMeta">{meme.like_count ?? 0} likes</p>
                </div>
                <button
                  className="adminDeleteBtn"
                  onClick={() => handleDelete(meme)}
                  disabled={deletingId === meme.id}
                >
                  {deletingId === meme.id ? "…" : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
