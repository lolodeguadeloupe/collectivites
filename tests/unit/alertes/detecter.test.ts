import { describe, it, expect } from "vitest";
import { detecterAlertes } from "@/lib/alertes/detecter";
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
          id: "D3Q4", libelle: "Test de restauration ?", aide: "…",
          type: "oui_non", pointsMax: 5,
          options: [
            { valeur: "oui", libelle: "Oui", points: 5 },
            { valeur: "non", libelle: "Non", points: 0 },
          ],
          alertes: [
            {
              si: "non",
              libelle: "Aucune restauration testée — risque majeur",
              gravite: "rouge",
            },
          ],
        },
      ],
    },
    {
      id: "D2", libelle: "Sécurité", poids: 3,
      questions: [
        {
          id: "D2Q5", libelle: "Services exposés ?", aide: "…",
          type: "choix_multiple", pointsMax: 5,
          options: [
            { valeur: "aucun", libelle: "Aucun", points: 5 },
            { valeur: "rdp", libelle: "RDP", points: 0 },
            { valeur: "fichiers", libelle: "Partage fichiers", points: 0 },
          ],
          alertes: [
            {
              si: ["rdp", "fichiers"],
              libelle: "Service exposé sans protection",
              gravite: "rouge",
            },
          ],
        },
      ],
    },
  ],
};

describe("detecterAlertes", () => {
  it("triggers a rouge alert when response matches si", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D3Q4", valeur: "non" },
    ]);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].gravite).toBe("rouge");
    expect(alertes[0].domaineId).toBe("D3");
    expect(alertes[0].questionId).toBe("D3Q4");
  });

  it("does not trigger when response doesn't match si", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D3Q4", valeur: "oui" },
    ]);
    expect(alertes).toHaveLength(0);
  });

  it("triggers for choix_multiple when any array element matches an si list", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D2Q5", valeur: ["rdp"] },
    ]);
    expect(alertes).toHaveLength(1);
  });

  it("does not trigger choix_multiple when 'aucun' is selected", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D2Q5", valeur: ["aucun"] },
    ]);
    expect(alertes).toHaveLength(0);
  });

  it("does not trigger for unanswered questions", () => {
    const alertes = detecterAlertes(bareme, []);
    expect(alertes).toHaveLength(0);
  });

  it("returns alerts in the order domain -> question -> alerte declaration", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D2Q5", valeur: ["rdp"] },
      { questionId: "D3Q4", valeur: "non" },
    ]);
    expect(alertes.map((a) => a.domaineId)).toEqual(["D3", "D2"]);
  });
});
