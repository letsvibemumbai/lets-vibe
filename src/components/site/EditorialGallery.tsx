"use client";

import { EditorialImage } from "@/components/editorial";
import { photoUrl, type PhotoKey } from "@/lib/photos";

type Frame = { key: PhotoKey; caption: string };

const FRAMES: Frame[] = [
  { key: "polaroid-1", caption: "The Beach Shack — sundown setting" },
  { key: "polaroid-2", caption: "Love Den — anniversary setup" },
  { key: "polaroid-3", caption: "Fairy lights, almost always" },
  { key: "polaroid-4", caption: "Candle service" },
  { key: "polaroid-5", caption: "Nature Paradise — Celebration setup" },
  { key: "polaroid-6", caption: "After-credit conversations" },
];

/**
 * Magazine-style photo grid. Six frames, varied aspect ratios using CSS grid
 * named areas. Quiet captions in tracking-out muted text. No tilts, no kid
 * polaroid frames, no marquee.
 */
export function EditorialGallery() {
  return (
    <div
      className="grid gap-4 sm:gap-6"
      style={{
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gridAutoRows: "minmax(140px, auto)",
      }}
    >
      <div className="col-span-12 sm:col-span-7 sm:row-span-2">
        <EditorialImage
          src={photoUrl(FRAMES[0].key, 1200)}
          alt={FRAMES[0].caption}
          caption={FRAMES[0].caption}
          aspect="4/5"
        />
      </div>
      <div className="col-span-6 sm:col-span-5">
        <EditorialImage
          src={photoUrl(FRAMES[1].key, 900)}
          alt={FRAMES[1].caption}
          caption={FRAMES[1].caption}
          aspect="4/3"
        />
      </div>
      <div className="col-span-6 sm:col-span-5">
        <EditorialImage
          src={photoUrl(FRAMES[2].key, 700)}
          alt={FRAMES[2].caption}
          caption={FRAMES[2].caption}
          aspect="1/1"
        />
      </div>
      <div className="col-span-12 sm:col-span-8">
        <EditorialImage
          src={photoUrl(FRAMES[3].key, 1400)}
          alt={FRAMES[3].caption}
          caption={FRAMES[3].caption}
          aspect="16/9"
        />
      </div>
      <div className="col-span-6 sm:col-span-4">
        <EditorialImage
          src={photoUrl(FRAMES[4].key, 700)}
          alt={FRAMES[4].caption}
          caption={FRAMES[4].caption}
          aspect="3/4"
        />
      </div>
      <div className="col-span-6 sm:col-span-5">
        <EditorialImage
          src={photoUrl(FRAMES[5].key, 800)}
          alt={FRAMES[5].caption}
          caption={FRAMES[5].caption}
          aspect="4/3"
        />
      </div>
    </div>
  );
}
