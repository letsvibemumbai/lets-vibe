import { describe, it, expect } from "vitest";
import { signWithSecret, verifyWithSecret } from "./token-core";

const SECRET = "test-secret-please-ignore";

describe("check-in token core", () => {
  it("signs a fixed-length token and verifies the round-trip", () => {
    const t = signWithSecret(SECRET, "booking-abc");
    expect(t).toHaveLength(24);
    expect(verifyWithSecret(SECRET, "booking-abc", t)).toBe(true);
  });

  it("rejects a token minted for a different booking id", () => {
    const t = signWithSecret(SECRET, "booking-abc");
    expect(verifyWithSecret(SECRET, "booking-xyz", t)).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    const t = signWithSecret(SECRET, "booking-abc");
    expect(verifyWithSecret("a-different-secret", "booking-abc", t)).toBe(false);
  });

  it("rejects empty, undefined, and wrong-length tokens", () => {
    expect(verifyWithSecret(SECRET, "booking-abc", "")).toBe(false);
    expect(verifyWithSecret(SECRET, "booking-abc", undefined)).toBe(false);
    expect(verifyWithSecret(SECRET, "booking-abc", "short")).toBe(false);
  });

  it("returns empty and never verifies when no secret is configured", () => {
    expect(signWithSecret("", "booking-abc")).toBe("");
    expect(verifyWithSecret("", "booking-abc", "anything")).toBe(false);
  });
});
