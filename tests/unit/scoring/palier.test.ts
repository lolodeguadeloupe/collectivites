import { describe, it, expect } from "vitest";
import { palierDepuisScore } from "@/lib/scoring/palier";
import type { Palier } from "@/lib/bareme";

const paliers: Palier[] = [
  { min: 0,  max: 39,  code: "critique",     libelle: "Critique",      couleur: "rouge"  },
  { min: 40, max: 59,  code: "fragile",      libelle: "Fragile",       couleur: "orange" },
  { min: 60, max: 79,  code: "enProgression",libelle: "En progression",couleur: "jaune"  },
  { min: 80, max: 100, code: "solide",       libelle: "Solide",        couleur: "vert"   },
];

describe("palierDepuisScore", () => {
  it.each([
    [0, "critique"],
    [39, "critique"],
    [40, "fragile"],
    [59, "fragile"],
    [60, "enProgression"],
    [79, "enProgression"],
    [80, "solide"],
    [100, "solide"],
    [39.9, "critique"],
    [40.0001, "fragile"],
  ])("score %s -> %s", (score, code) => {
    expect(palierDepuisScore(paliers, score).code).toBe(code);
  });

  it("throws for scores outside [0,100]", () => {
    expect(() => palierDepuisScore(paliers, -1)).toThrow();
    expect(() => palierDepuisScore(paliers, 101)).toThrow();
  });
});
