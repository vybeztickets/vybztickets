"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImageUploadField({
  value,
  onChange,
  label = "Event flyer",
  hint = "JPG, PNG or WebP · max 10MB",
  aspectRatio = "1:1",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  aspectRatio?: "1:1" | "16:9";
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop();
      const path = `${user?.id ?? "anon"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(path);
      onChange(publicUrl);
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      setUploading(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  const paddingBottom = aspectRatio === "16:9" ? "56.25%" : "100%";

  return (
    <div>
      {label && <label className="block text-[#0a0a0a]/50 text-xs mb-1.5">{label}</label>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {value ? (
        <div className="relative rounded-xl overflow-hidden" style={{ paddingBottom, background: "rgba(0,0,0,0.06)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            >
              {uploading ? "Uploading..." : "Change image"}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          style={{
            paddingTop: 32, paddingBottom: 32,
            border: `1px dashed ${dragOver ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)"}`,
            background: dragOver ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.02)",
          }}
        >
          {uploading ? (
            <div className="w-6 h-6 rounded-full border-2 border-[#0a0a0a] border-t-transparent animate-spin" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          )}
          <div className="text-center">
            <p className="text-[#0a0a0a]/50 text-sm font-medium">{uploading ? "Uploading image..." : "Upload image"}</p>
            <p className="text-[#0a0a0a]/25 text-xs mt-0.5">{hint}</p>
          </div>
        </div>
      )}
    </div>
  );
}
