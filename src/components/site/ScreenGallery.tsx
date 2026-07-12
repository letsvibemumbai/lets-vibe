import Image from "next/image";
import { SectionLabel } from "@/components/editorial";
import type { ScreenMedia } from "@/types";

/**
 * Public gallery of a screen's admin-uploaded photos + videos. Presentational
 * only; renders nothing when there's no media (the page keeps its fallback).
 */
export function ScreenGallery({ items }: { items: ScreenMedia[] }) {
  if (items.length === 0) return null;
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <SectionLabel className="mb-8">Gallery</SectionLabel>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <figure key={m.id} className="flex flex-col">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream-tonal">
                {m.type === "image" ? (
                  <Image
                    src={m.url}
                    alt={m.caption || "Screen photo"}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover photo-grade"
                    unoptimized
                  />
                ) : (
                  <video
                    src={m.url}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                  />
                )}
              </div>
              {m.caption ? (
                <figcaption className="mt-2 text-[13px] leading-[1.5] text-muted">
                  {m.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
