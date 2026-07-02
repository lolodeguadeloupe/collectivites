import { describe, it, expect } from "vitest";
import { calculerScoreGlobal } from "@/lib/scoring/global";
import type { Bareme, Reponse } from "@/lib/bareme";

const bareme: Bareme = {
  version: "test",
  paliers: [
    { min: 0,  max: 39,  code: "critique",     libelle: "Critique",      couleur: "rouge"  },
    { min: 40, max: 59,  code: "fragile",      libelle: "Fragile",       couleur: "orange" },
    { min: 60, max: 79,  code: "enProgression",libelle: "En progression",couleur: "jaune"  },
    { min: 80, max: 100, code: "solide",       libelle: "Solide",        couleur: "vert"   },
  ],
  domaines: [
    {
      id: "D1", libelle: "D1", poids: 1,
      questions: [{
        id: "D1Q1", libelle: "Q", aide: "A", type: "oui_non", pointsMax: 10,
        options: [
          { valeur: "oui", libelle: "Oui", points: 10 },
          { valeur: "non", libelle: "Non", points: 0 },
        ],
      }],
    },
    {
      id: "D2", libelle: "D2", poids: 3,
      questions: [{
        id: "D2Q1", libelle: "Q", aide: "A", type: "oui_non", pointsMax: 10,
        options: [
          { valeur: "oui", libelle: "Oui", points: 10 },
          { valeur: "non", libelle: "Non", points: 0 },
        ],
      }],
    },
  ],
};

describe("calculerScoreGlobal", () => {
  it("returns 100% with all-best answers", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D2Q1", valeur: "oui" },
    ];
    const s = calculerScoreGlobal(bareme, reponses);
    expect(s.pourcentage).toBe(100);
    expect(s.palier.code).toBe("solide");
    expect(s.parDomaine).toHaveLength(2);
  });

  it("weights D2 (poids=3) higher than D1 (poids=1): D1=100, D2=0 -> 25%", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D2Q1", valeur: "non" },
    ];
    const s = calculerScoreGlobal(bareme, reponses);
    expect(s.pourcentage).toBeCloseTo((100 * 1 + 0 * 3) / (1 + 3), 2);
    expect(s.palier.code).toBe("critique");
  });

  it("excludes domains with no answers from the weighted average", () => {
    const reponses: Reponse[] = [{ questionId: "D1Q1", valeur: "oui" }];
    const s = calculerScoreGlobal(bareme, reponses);
    expect(s.pourcentage).toBe(100);
    expect(s.parDomaine.find((d) => d.domaineId === "D2")?.pointsMax).toBe(0);
  });

  it("returns 0% with no answers at all", () => {
    const s = calculerScoreGlobal(bareme, []);
    expect(s.pourcentage).toBe(0);
    expect(s.palier.code).toBe("critique");
  });
});
