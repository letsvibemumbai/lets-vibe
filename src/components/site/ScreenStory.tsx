"use client";

import * as React from "react";
import {
  DisplayHeading,
  EditorialImage,
  QuietButton,
  SectionLabel,
} from "@/components/editorial";
import { cn } from "@/lib/utils";

type Detail = { label: string; value: string };

type Props = {
  index: string; // "01", "02"
  name: string;
  poeticName: string;
  description: string;
  details: Detail[];
  photoSrc: string;
  photoCaption?: string;
  href: string;
  /** Flip image to right side on alternating rows. */
  flip?: boolean;
};

/**
 * One vertical screen block. Editorial alternating asymmetric layout —
 * large photo on one side, copy on the other. Each row stands ~80vh tall.
 */
export function ScreenStory({
  index,
  name,
  poeticName,
  description,
  details,
  photoSrc,
  photoCaption,
  href,
  flip,
}: Props) {
  return (
    <article
      className={cn(
        "grid grid-cols-1 items-center gap-10 py-20 sm:py-28 lg:grid-cols-12 lg:gap-16",
      )}
    >
      <div
        className={cn(
          "lg:col-span-7",
          flip ? "lg:order-2" : "lg:order-1",
        )}
      >
        <EditorialImage
          src={photoSrc}
          alt={`${name} screen`}
          caption={photoCaption}
          aspect="4/5"
        />
      </div>

      <div
        className={cn(
          "flex flex-col gap-7 lg:col-span-5",
          flip ? "lg:order-1 lg:pr-6" : "lg:order-2 lg:pl-6",
        )}
      >
        <div className="flex items-center gap-4">
          <SectionLabel>{index} /</SectionLabel>
          <SectionLabel>{name}</SectionLabel>
        </div>

        <DisplayHeading as="h3" size="md">
          {poeticName}
        </DisplayHeading>

        <p className="text-[15px] leading-[1.7] text-muted">
          {description}
        </p>

        <dl className="mt-2 grid grid-cols-1 gap-y-3 border-y border-hairline py-5 text-[13px]">
          {details.map((d) => (
            <div
              key={d.label}
              className="flex items-baseline justify-between gap-4"
            >
              <dt className="text-[10px] uppercase tracking-[0.22em] text-muted">
                {d.label}
              </dt>
              <dd className="text-ink">{d.value}</dd>
            </div>
          ))}
        </dl>

        <div className="pt-2">
          <QuietButton href={href} variant="link" size="md">
            Reserve this room
          </QuietButton>
        </div>
      </div>
    </article>
  );
}
