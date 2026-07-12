import { describe, expect, it } from "vitest";
import { passwordMatches, signSession, verifySession } from "./admin-session";

const SECRET = "test-secret-value-please-change";
const TTL = 60_000;

describe("admin-session token", () => {
  it("round-trips a valid token", () => {
    const now = 1_000_000;
    const token = signSession(SECRET, TTL, now);
    const payload = verifySession(SECRET, token, now + 1000);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("admin");
    expect(payload!.exp).toBe(now + TTL);
  });

  it("rejects an expired token", () => {
    const now = 1_000_000;
    const token = signSession(SECRET, TTL, now);
    expect(verifySession(SECRET, token, now + TTL + 1)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = signSession(SECRET, TTL, 1_000_000);
    expect(verifySession("other-secret", token, 1_000_500)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = signSession(SECRET, TTL, 1_000_000);
    const [, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ sub: "admin", iat: 0, exp: 9_999_999_999_999 }),
    ).toString("base64url");
    expect(verifySession(SECRET, `${forged}.${sig}`, 1_000_500)).toBeNull();
  });

  it("rejects empty / malformed tokens and empty secret", () => {
    expect(verifySession(SECRET, undefined)).toBeNull();
    expect(verifySession(SECRET, "")).toBeNull();
    expect(verifySession(SECRET, "no-dot")).toBeNull();
    expect(verifySession("", signSession(SECRET, TTL))).toBeNull();
    expect(signSession("", TTL)).toBe("");
  });
});

describe("passwordMatches", () => {
  it("accepts the exact password", () => {
    expect(passwordMatches("LetsVibe@2026", "LetsVibe@2026")).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(passwordMatches("wrong", "LetsVibe@2026")).toBe(false);
    expect(passwordMatches("letsvibe@2026", "LetsVibe@2026")).toBe(false);
  });

  it("rejects when the expected password is unset", () => {
    expect(passwordMatches("anything", "")).toBe(false);
  });
});
