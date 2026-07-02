import { describe, it, expect } from "vitest";
import { calculerScoreDomaine } from "@/lib/scoring/domaine";
import type { Domaine, Reponse } from "@/lib/bareme";

const domaine: Domaine = {
  id: "D1",
  libelle: "Test",
  poids: 1,
  questions: [
    {
      id: "D1Q1",
      libelle: "Q1", aide: "A", type: "oui_non", pointsMax: 5,
      options: [
        { valeur: "oui", libelle: "Oui", points: 5 },
        { valeur: "non", libelle: "Non", points: 0 },
      ],
    },
    {
      id: "D1Q2",
      libelle: "Q2", aide: "A", type: "oui_non", pointsMax: 10,
      options: [
        { valeur: "oui", libelle: "Oui", points: 10 },
        { valeur: "non", libelle: "Non", points: 0 },
      ],
    },
  ],
};

describe("calculerScoreDomaine", () => {
  it("returns 100% when every question is answered with the best option", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D1Q2", valeur: "oui" },
    ];
    const s = calculerScoreDomaine(domaine, reponses);
    expect(s.pourcentage).toBe(100);
    expect(s.pointsObtenus).toBe(15);
    expect(s.pointsMax).toBe(15);
    expect(s.nbQuestionsRepondues).toBe(2);
  });

  it("returns 0% when every question is answered with the worst option", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "non" },
      { questionId: "D1Q2", valeur: "non" },
    ];
    expect(calculerScoreDomaine(domaine, reponses).pourcentage).toBe(0);
  });

  it("weights by pointsMax (5+0)/(5+10) = 33%", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D1Q2", valeur: "non" },
    ];
    const s = calculerScoreDomaine(domaine, reponses);
    expect(s.pourcentage).toBeCloseTo((5 / 15) * 100, 2);
  });

  it("excludes unanswered questions from both numerator and denominator", () => {
    const reponses: Reponse[] = [{ questionId: "D1Q1", valeur: "oui" }];
    const s = calculerScoreDomaine(domaine, reponses);
    expect(s.pourcentage).toBe(100);
    expect(s.pointsMax).toBe(5);
    expect(s.nbQuestionsRepondues).toBe(1);
  });

  it("returns 0% with no answers at all", () => {
    const s = calculerScoreDomaine(domaine, []);
    expect(s.pourcentage).toBe(0);
    expect(s.pointsMax).toBe(0);
    expect(s.nbQuestionsRepondues).toBe(0);
  });

  it("ignores responses that reference an unknown question in this domain", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D9Q9", valeur: "oui" },
    ];
    const s = calculerScoreDomaine(domaine, reponses);
    expect(s.nbQuestionsRepondues).toBe(1);
  });
});
