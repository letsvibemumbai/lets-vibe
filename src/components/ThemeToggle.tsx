"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Sun/moon theme switch. Mount-guarded so the icon doesn't mismatch on
 * hydration. `tone="admin"` uses neutral ring styling for the admin header.
 */
export function ThemeToggle({
  className,
  tone = "site",
}: {
  className?: string;
  tone?: "site" | "admin";
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      data-cursor="cta"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        tone === "admin"
          ? "text-foreground ring-1 ring-hairline-strong hover:bg-accent hover:text-accent-foreground"
          : "text-ink/75 hover:bg-ink/5 hover:text-ink",
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-5 w-5" strokeWidth={1.5} />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={1.5} />
      )}
    </button>
  );
}
