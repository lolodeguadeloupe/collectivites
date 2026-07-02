import { describe, it, expect } from "vitest";
import path from "node:path";
import { chargerBareme } from "@/lib/bareme/loader";

const BAREME_PATH = path.resolve(__dirname, "../../../config/bareme.yaml");

describe("bareme v1 (config/bareme.yaml)", () => {
  it("charge et valide le barème officiel", () => {
    const b = chargerBareme(BAREME_PATH);
    expect(b.version).toBe("2026.1");
    expect(b.domaines).toHaveLength(7);
    const nb = b.domaines.reduce((n, d) => n + d.questions.length, 0);
    expect(nb).toBe(32);
  });
});
