import { describe, it, expect } from "vitest";
import path from "node:path";
import { chargerBareme } from "@/lib/bareme/loader";
import {
  calculerScoreGlobal,
} from "@/lib/scoring";
import { detecterAlertes } from "@/lib/alertes/detecter";
import { genererActions, trierActions } from "@/lib/actions";
import type { Reponse } from "@/lib/bareme";

const BAREME_PATH = path.join(
  process.cwd(),
  "config",
  "bareme.yaml",
);

describe("moteur — bout en bout avec le barème v1", () => {
  const bareme = chargerBareme(BAREME_PATH);

  it("charge le barème v1 (7 domaines, 32 questions)", () => {
    expect(bareme.version).toBe("2026.1");
    expect(bareme.domaines).toHaveLength(7);
    const total = bareme.domaines.reduce(
      (n, d) => n + d.questions.length,
      0,
    );
    expect(total).toBe(32);
  });

  it("réponses catastrophiques → palier 'critique' + alertes rouges multiples", () => {
    const reponses: Reponse[] = [];
    for (const d of bareme.domaines) {
      for (const q of d.questions) {
        const worst = [...q.options].sort((a, b) => a.points - b.points)[0];
        const valeur =
          q.type === "choix_multiple" ? [worst.valeur] : worst.valeur;
        reponses.push({ questionId: q.id, valeur });
      }
    }

    const score = calculerScoreGlobal(bareme, reponses);
    expect(score.palier.code).toBe("critique");

    const alertes = detecterAlertes(bareme, reponses);
    expect(alertes.filter((a) => a.gravite === "rouge").length).toBeGreaterThanOrEqual(4);

    const actions = trierActions(genererActions(bareme, reponses));
    expect(actions[0].priorite).toBe("URGENT");
    for (const a of actions) {
      expect(a.priorite).toBeDefined();
      expect(a.effort).toBeDefined();
    }
  });

  it("réponses idéales → palier 'solide' et aucune alerte", () => {
    const reponses: Reponse[] = [];
    for (const d of bareme.domaines) {
      for (const q of d.questions) {
        const best = [...q.options].sort((a, b) => b.points - a.points)[0];
        const valeur =
          q.type === "choix_multiple" ? [best.valeur] : best.valeur;
        reponses.push({ questionId: q.id, valeur });
      }
    }
    const score = calculerScoreGlobal(bareme, reponses);
    expect(score.palier.code).toBe("solide");
    expect(detecterAlertes(bareme, reponses)).toHaveLength(0);
  });

  it("chaque domaine est scoré indépendamment dans parDomaine", () => {
    const reponses: Reponse[] = [
      { questionId: "D3Q1", valeur: "non" },
    ];
    const score = calculerScoreGlobal(bareme, reponses);
    const d3 = score.parDomaine.find((s) => s.domaineId === "D3");
    expect(d3?.nbQuestionsRepondues).toBe(1);
    expect(d3?.pourcentage).toBe(0);
    const d1 = score.parDomaine.find((s) => s.domaineId === "D1");
    expect(d1?.nbQuestionsRepondues).toBe(0);
  });
});
