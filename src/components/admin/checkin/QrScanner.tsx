"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, ScanLine, Search, SquareX } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REGION_ID = "lv-qr-reader";
const SCAN_CONFIG = { fps: 10, qrbox: { width: 240, height: 240 } } as const;

/**
 * Turn a scanned payload into an admin verify-page path. Accepts a full
 * check-in URL (preserving the ?t signature) or a bare booking id.
 */
export function parseScan(text: string): string | null {
  const raw = text.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const m = u.pathname.match(/\/admin\/check-in\/([^/?#]+)/);
    if (!m) return null;
    const id = decodeURIComponent(m[1]);
    const t = u.searchParams.get("t");
    return `/admin/check-in/${encodeURIComponent(id)}${t ? `?t=${encodeURIComponent(t)}` : ""}`;
  } catch {
    if (/^[A-Za-z0-9_-]{4,}$/.test(raw)) return `/admin/check-in/${raw}`;
    return null;
  }
}

function isNoCameraError(e: unknown): boolean {
  const name = (e as { name?: string })?.name ?? "";
  return (
    name === "OverconstrainedError" ||
    name === "NotFoundError" ||
    name === "DevicesNotFoundError"
  );
}

function cameraErrorMessage(e: unknown): string {
  const name = (e as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera access was blocked. Allow camera for this site in your browser, or use manual entry below.";
  }
  if (isNoCameraError(e)) {
    return "No usable camera was found. Use manual entry below.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The camera is busy in another app. Close it and retry, or use manual entry below.";
  }
  return e instanceof Error && e.message
    ? `${e.message}. You can use manual entry below.`
    : "Could not start the camera. Use manual entry below.";
}

type ScanState = "idle" | "starting" | "scanning" | "navigating" | "error";

export function QrScanner() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  // Raw teardown — never touches React state, so it is safe to call from the
  // unmount cleanup and the post-decode navigate path.
  async function teardown() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try {
        await s.stop();
      } catch {
        /* already stopped */
      }
      try {
        s.clear();
      } catch {
        /* noop */
      }
    }
  }

  // User pressed "Stop" — tear down AND return the UI to a restartable state.
  async function stopForUser() {
    await teardown();
    setState("idle");
    setError(null);
  }

  function onDecode(decoded: string) {
    if (handledRef.current) return;
    const target = parseScan(decoded);
    if (!target) return;
    handledRef.current = true;
    setState("navigating");
    void teardown().finally(() => router.push(target));
  }

  async function start() {
    if (state === "starting" || state === "scanning") return;
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setState("error");
      setError(
        "The camera needs a secure (https) connection. Open this admin over https, or use manual entry below.",
      );
      return;
    }
    setState("starting");
    setError(null);
    handledRef.current = false;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      try {
        const scanner = new Html5Qrcode(REGION_ID);
        scannerRef.current = scanner;
        await scanner.start({ facingMode: "environment" }, SCAN_CONFIG, onDecode, () => {});
      } catch (e) {
        // Rear camera unavailable (front-only device) — retry with any camera.
        if (!isNoCameraError(e)) throw e;
        await teardown();
        const scanner = new Html5Qrcode(REGION_ID);
        scannerRef.current = scanner;
        await scanner.start({ facingMode: "user" }, SCAN_CONFIG, onDecode, () => {});
      }
      setState("scanning");
    } catch (e) {
      await teardown();
      setState("error");
      setError(cameraErrorMessage(e));
    }
  }

  useEffect(() => {
    return () => {
      void teardown();
    };
  }, []);

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const target = parseScan(manual);
    if (!target) {
      setError("That doesn't look like a booking ID or a check-in link.");
      return;
    }
    setError(null);
    router.push(target);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-card p-5 ring-1 ring-hairline">
        <div
          id={REGION_ID}
          role="region"
          aria-label="QR scanner camera"
          className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-black/40 text-foreground/40"
        >
          {state !== "scanning" && (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-2 text-center"
            >
              {state === "navigating" ? (
                <Loader2 className="h-10 w-10 animate-spin" strokeWidth={1.5} />
              ) : (
                <ScanLine className="h-10 w-10" strokeWidth={1.5} />
              )}
              <p className="px-6 text-xs text-foreground/50">
                {state === "starting"
                  ? "Starting camera…"
                  : state === "navigating"
                    ? "Opening booking…"
                    : "Point the camera at the guest's QR pass."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          {state === "scanning" ? (
            <Button variant="outline" onClick={stopForUser}>
              <SquareX className="h-4 w-4" />
              Stop camera
            </Button>
          ) : (
            <Button
              onClick={start}
              disabled={state === "starting" || state === "navigating"}
            >
              {state === "starting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Start camera
            </Button>
          )}
        </div>

        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="mt-3 text-center text-xs text-rose-300"
          >
            {error}
          </p>
        )}
      </div>

      <form onSubmit={submitManual} className="flex items-end gap-2">
        <div className="flex-1">
          <label
            htmlFor="manual-booking-id"
            className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-foreground/45"
          >
            Or enter a booking ID
          </label>
          <Input
            id="manual-booking-id"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="e.g. 8FQ2Kd…"
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={!manual.trim()}>
          <Search className="h-4 w-4" />
          Look up
        </Button>
      </form>
    </div>
  );
}
