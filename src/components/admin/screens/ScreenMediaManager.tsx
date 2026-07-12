"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
  Video as VideoIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeScreenMediaAction } from "@/app/actions/admin-screens";
import type { ScreenId, ScreenMedia } from "@/types";

type Props = {
  screenId: ScreenId;
  value: ScreenMedia[];
  onChange: (next: ScreenMedia[]) => void;
};

const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime";
const MAX_ITEMS = 24;

export function ScreenMediaManager({ screenId, value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, startRemove] = useTransition();

  // Index of the first image = the cover used across the site.
  const coverIndex = value.findIndex((m) => m.type === "image");

  async function uploadOne(file: File): Promise<ScreenMedia | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("screenId", screenId);
    const res = await fetch("/api/admin/screens/media", { method: "POST", body: fd });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(`${file.name}: ${data.error ?? "Upload failed"}`);
      return null;
    }
    const data = (await res.json()) as Omit<ScreenMedia, "order" | "caption">;
    return { ...data, order: 0 };
  }

  async function onFiles(files: FileList) {
    const picked = Array.from(files);
    const room = MAX_ITEMS - value.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_ITEMS} items per screen.`);
      return;
    }
    const batch = picked.slice(0, room);
    setUploading(true);
    const added: ScreenMedia[] = [];
    try {
      // Sequential keeps order deterministic and avoids stale-state races.
      for (const file of batch) {
        const item = await uploadOne(file);
        if (item) added.push(item);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (added.length) {
      onChange([...value, ...added].map((m, i) => ({ ...m, order: i })));
      toast.success(`${added.length} file${added.length > 1 ? "s" : ""} uploaded`);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((m, i) => ({ ...m, order: i })));
  }

  function setCaption(id: string, caption: string) {
    onChange(value.map((m) => (m.id === id ? { ...m, caption } : m)));
  }

  function remove(item: ScreenMedia) {
    if (
      !window.confirm(
        "Delete this media? It's removed from Firebase Storage immediately.",
      )
    ) {
      return;
    }
    startRemove(async () => {
      try {
        await removeScreenMediaAction(screenId, item.id);
        onChange(
          value.filter((m) => m.id !== item.id).map((m, i) => ({ ...m, order: i })),
        );
        toast.success("Media removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't remove media");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFiles(e.target.files);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || value.length >= MAX_ITEMS}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading…" : "Upload images / videos"}
        </Button>
        <p className="text-xs text-foreground/55">
          JPG / PNG / WebP up to 5MB · MP4 / WebM / MOV up to 50MB. The first
          image is the cover used across the site.
        </p>
      </div>

      {value.length === 0 ? (
        <div className="flex aspect-[16/9] w-full max-w-md items-center justify-center rounded-2xl border border-dashed border-hairline-strong bg-cream/40 text-xs text-foreground/45">
          No media yet — upload photos and videos for this theme.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((item, index) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-2xl bg-card ring-1 ring-hairline"
            >
              <div className="relative aspect-[16/10] bg-cream">
                {item.type === "image" ? (
                  <Image
                    src={item.url}
                    alt={item.caption || "Screen media"}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                  {item.type === "image" ? (
                    <ImageIcon className="h-3 w-3" />
                  ) : (
                    <VideoIcon className="h-3 w-3" />
                  )}
                  {item.type}
                </span>
                {index === coverIndex && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                    <Star className="h-3 w-3" strokeWidth={2.5} /> Cover
                  </span>
                )}
              </div>
              <div className="space-y-2 p-3">
                <Input
                  value={item.caption ?? ""}
                  onChange={(e) => setCaption(item.id, e.target.value)}
                  placeholder="Caption (optional)"
                  maxLength={140}
                  className="h-9 text-sm"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <IconBtn
                      label="Move earlier"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      label="Move later"
                      onClick={() => move(index, 1)}
                      disabled={index === value.length - 1}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    disabled={removing}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground/55 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-foreground/50">
        Reordering and captions are saved when you click <strong>Save screen</strong>.
        Deletions apply immediately.
      </p>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/60 ring-1 ring-hairline-strong transition-colors hover:bg-card hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}
