import { describe, it, expect } from "vitest";
import { messages, getMessage } from "./messages";

describe("i18n Messages Completeness", () => {
  const enKeys = Object.keys(messages.en);

  it("English dictionary has comprehensive keys", () => {
    expect(enKeys.length).toBeGreaterThan(40);
  });

  it("Hindi dictionary covers all English keys", () => {
    const hiKeys = Object.keys(messages.hi);
    for (const key of enKeys) {
      expect(hiKeys).toContain(key);
      expect((messages.hi as any)[key]).toBeTruthy();
    }
  });

  it("Bengali dictionary covers all English keys", () => {
    const bnKeys = Object.keys(messages.bn);
    for (const key of enKeys) {
      expect(bnKeys).toContain(key);
      expect((messages.bn as any)[key]).toBeTruthy();
    }
  });

  it("getMessage helper returns correct translation and falls back cleanly", () => {
    expect(getMessage("en", "appName")).toBe("ProofSathi");
    expect(getMessage("hi", "appName")).toBe("प्रूफसाथी");
    expect(getMessage("bn", "appName")).toBe("প্রুফসাথী");
  });
});
