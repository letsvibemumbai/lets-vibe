"use client";

import * as React from "react";
import {
  ContinuousBackground,
  CustomCursor,
  NoiseTexture,
} from "@/components/ui-vibe";

/**
 * Public-site shell. Cream wash background, near-invisible film grain on
 * top, quiet editorial cursor.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark">
      <ContinuousBackground />
      <NoiseTexture opacity={0.02} />
      <CustomCursor />
      {children}
    </div>
  );
}
