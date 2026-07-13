"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_TIME_FORMAT,
  TIME_FORMAT_COOKIE,
  isTimeFormat,
  type TimeFormat,
} from "@/lib/time";

type Ctx = {
  format: TimeFormat;
  setFormat: (f: TimeFormat) => void;
  toggle: () => void;
};

const TimeFormatContext = createContext<Ctx | null>(null);

function readCookie(): TimeFormat {
  if (typeof document === "undefined") return DEFAULT_TIME_FORMAT;
  const m = document.cookie.match(/(?:^|;\s*)letsvibe\.tf=(12|24)/);
  return m && isTimeFormat(m[1]) ? (m[1] as TimeFormat) : DEFAULT_TIME_FORMAT;
}

/**
 * Provides the viewer's 12h/24h preference. Both SSR and the first client
 * render use DEFAULT_TIME_FORMAT (so no hydration mismatch); the saved cookie
 * is applied in an effect right after mount.
 */
export function TimeFormatProvider({ children }: { children: React.ReactNode }) {
  const [format, setFormatState] = useState<TimeFormat>(DEFAULT_TIME_FORMAT);

  useEffect(() => {
    const saved = readCookie();
    if (saved !== format) setFormatState(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFormat = useCallback((f: TimeFormat) => {
    setFormatState(f);
    document.cookie = `${TIME_FORMAT_COOKIE}=${f}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const toggle = useCallback(
    () => setFormat(format === "12" ? "24" : "12"),
    [format, setFormat],
  );

  return (
    <TimeFormatContext.Provider value={{ format, setFormat, toggle }}>
      {children}
    </TimeFormatContext.Provider>
  );
}

/** Read the current time-format preference. Falls back to the default outside
 * a provider so components never crash. */
export function useTimeFormat(): Ctx {
  return (
    useContext(TimeFormatContext) ?? {
      format: DEFAULT_TIME_FORMAT,
      setFormat: () => {},
      toggle: () => {},
    }
  );
}
