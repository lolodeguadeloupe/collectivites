import { describe, it, expect } from "vitest";
import { calculerPointsReponse } from "@/lib/scoring/question";
import type { Question } from "@/lib/bareme";

const questionOuiNon: Question = {
  id: "D1Q1",
  libelle: "Q ?",
  aide: "A",
  type: "oui_non",
  pointsMax: 5,
  options: [
    { valeur: "oui", libelle: "Oui", points: 5 },
    { valeur: "non", libelle: "Non", points: 0 },
  ],
};

const questionEchelle: Question = {
  id: "D1Q2",
  libelle: "Q ?",
  aide: "A",
  type: "echelle_1_4",
  pointsMax: 4,
  options: [
    { valeur: "1", libelle: "1", points: 0 },
    { valeur: "2", libelle: "2", points: 1 },
    { valeur: "3", libelle: "3", points: 3 },
    { valeur: "4", libelle: "4", points: 4 },
  ],
};

const questionChoixMultiple: Question = {
  id: "D1Q3",
  libelle: "Q ?",
  aide: "A",
  type: "choix_multiple",
  pointsMax: 5,
  options: [
    { valeur: "aucun", libelle: "Aucun", points: 5 },
    { valeur: "rdp", libelle: "RDP", points: 0 },
    { valeur: "fichiers", libelle: "Partage de fichiers", points: 0 },
    { valeur: "web", libelle: "Site web interne", points: 2 },
  ],
};

describe("calculerPointsReponse", () => {
  it("returns the option's points for oui_non", () => {
    expect(calculerPointsReponse(questionOuiNon, "oui")).toBe(5);
    expect(calculerPointsReponse(questionOuiNon, "non")).toBe(0);
  });

  it("returns the option's points for echelle_1_4", () => {
    expect(calculerPointsReponse(questionEchelle, "3")).toBe(3);
    expect(calculerPointsReponse(questionEchelle, "1")).toBe(0);
  });

  it("sums selected options for choix_multiple, capped at pointsMax", () => {
    expect(calculerPointsReponse(questionChoixMultiple, ["aucun"])).toBe(5);
    expect(
      calculerPointsReponse(questionChoixMultiple, ["rdp", "fichiers"]),
    ).toBe(0);
    expect(
      calculerPointsReponse(questionChoixMultiple, ["aucun", "web"]),
    ).toBe(5);
  });

  it("returns 0 for choix_multiple with empty selection", () => {
    expect(calculerPointsReponse(questionChoixMultiple, [])).toBe(0);
  });

  it("throws if the response value doesn't match any option", () => {
    expect(() => calculerPointsReponse(questionOuiNon, "peut-etre")).toThrow(
      /valeur/i,
    );
  });

  it("throws if the response shape doesn't match the question type", () => {
    expect(() =>
      calculerPointsReponse(questionChoixMultiple, "aucun"),
    ).toThrow(/tableau/i);
    expect(() => calculerPointsReponse(questionOuiNon, ["oui"])).toThrow(
      /chaîne/i,
    );
  });
});
