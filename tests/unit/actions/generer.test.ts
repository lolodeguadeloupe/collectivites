import { describe, it, expect } from "vitest";
import { genererActions } from "@/lib/actions/generer";
import type { Bareme, Reponse } from "@/lib/bareme";

const bareme: Bareme = {
  version: "test",
  paliers: [
    { min: 0, max: 39, code: "critique", libelle: "C", couleur: "rouge" },
    { min: 40, max: 59, code: "fragile", libelle: "F", couleur: "orange" },
    { min: 60, max: 79, code: "enProgression", libelle: "E", couleur: "jaune" },
    { min: 80, max: 100, code: "solide", libelle: "S", couleur: "vert" },
  ],
  domaines: [
    {
      id: "D3", libelle: "Sauvegarde", poids: 3,
      questions: [
        {
          id: "D3Q1", libelle: "Sauvegardes ?", aide: "…",
          type: "oui_non", pointsMax: 5,
          options: [
            { valeur: "oui", libelle: "Oui", points: 5 },
            { valeur: "non", libelle: "Non", points: 0 },
          ],
          actions: [
            {
              si: "non",
              libelle: "Mettre en place une sauvegarde externalisée",
              priorite: "URGENT",
              effort: "MOYEN",
              budgetMin: 500,
              budgetMax: 2000,
              ressourceUrl: "https://cyber.gouv.fr/sauvegardes",
            },
          ],
        },
      ],
    },
  ],
};

describe("genererActions", () => {
  it("produces an action when a matching response is given", () => {
    const actions = genererActions(bareme, [
      { questionId: "D3Q1", valeur: "non" },
    ]);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      questionId: "D3Q1",
      domaineId: "D3",
      priorite: "URGENT",
      effort: "MOYEN",
      budgetMin: 500,
      budgetMax: 2000,
      ressourceUrl: "https://cyber.gouv.fr/sauvegardes",
    });
    expect(actions[0].libelle).toContain("sauvegarde");
  });

  it("produces no actions when responses don't match", () => {
    const actions = genererActions(bareme, [
      { questionId: "D3Q1", valeur: "oui" },
    ]);
    expect(actions).toHaveLength(0);
  });

  it("produces no actions for unanswered questions", () => {
    expect(genererActions(bareme, [])).toHaveLength(0);
  });
});
