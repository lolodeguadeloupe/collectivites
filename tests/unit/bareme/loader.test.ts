import { describe, it, expect } from "vitest";
import path from "node:path";
import { chargerBareme, BaremeInvalideError } from "@/lib/bareme/loader";

const FIXTURE_VALIDE = path.join(
  __dirname,
  "fixtures",
  "bareme-test.yaml",
);
const FIXTURE_INVALIDE = path.join(
  __dirname,
  "fixtures",
  "bareme-invalide.yaml",
);

describe("chargerBareme", () => {
  it("loads and validates a well-formed YAML file", () => {
    const b = chargerBareme(FIXTURE_VALIDE);
    expect(b.version).toBe("test-1.0");
    expect(b.paliers).toHaveLength(4);
    expect(b.domaines).toHaveLength(1);
    expect(b.domaines[0].questions[0].id).toBe("D1Q1");
  });

  it("throws BaremeInvalideError with French message on structural errors", () => {
    expect(() => chargerBareme(FIXTURE_INVALIDE)).toThrow(BaremeInvalideError);
    try {
      chargerBareme(FIXTURE_INVALIDE);
    } catch (e) {
      expect(e).toBeInstanceOf(BaremeInvalideError);
      const msg = (e as Error).message;
      expect(msg).toMatch(/pointsMax/);
      expect(msg).toMatch(/palier/i);
    }
  });

  it("throws if the file does not exist", () => {
    expect(() => chargerBareme("/tmp/does-not-exist.yaml")).toThrow();
  });
});
