"use client";

import Image from "next/image";
import { Marquee } from "@/components/ui/marquee";
import { photoUrl, type PhotoKey } from "@/lib/photos";

type Frame = {
  key: PhotoKey;
  caption: string;
};

const FRAMES: Frame[] = [
  { key: "polaroid-1", caption: "Movie night" },
  { key: "polaroid-2", caption: "Her birthday" },
  { key: "polaroid-3", caption: "Fairy lights, again" },
  { key: "polaroid-4", caption: "Candles say a lot" },
  { key: "polaroid-5", caption: "Just because" },
  { key: "polaroid-6", caption: "The warm one" },
];

function FrameCard({ p }: { p: Frame }) {
  return (
    <figure className="mx-2 flex w-[18rem] shrink-0 flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-vibe-cream-dark ring-1 ring-vibe-black/[0.06]">
        <Image
          src={photoUrl(p.key, 700)}
          alt={p.caption}
          fill
          sizes="280px"
          unoptimized
          className="object-cover"
        />
      </div>
      <figcaption className="px-1 text-[11px] uppercase tracking-[0.22em] text-vibe-black/55">
        {p.caption}
      </figcaption>
    </figure>
  );
}

export function PolaroidGallery() {
  return (
    <div className="relative">
      <Marquee className="[--duration:65s] [--gap:0.25rem] py-6" pauseOnHover>
        {FRAMES.map((p, i) => <FrameCard key={`${p.key}-${i}`} p={p} />)}
      </Marquee>
    </div>
  );
}
