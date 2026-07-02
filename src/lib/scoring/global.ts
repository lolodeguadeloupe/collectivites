import type { Bareme, Reponse, ScoreGlobal } from "@/lib/bareme";
import { calculerScoreDomaine } from "./domaine";
import { palierDepuisScore } from "./palier";

export function calculerScoreGlobal(
  bareme: Bareme,
  reponses: Reponse[],
): ScoreGlobal {
  const parDomaine = bareme.domaines.map((d) =>
    calculerScoreDomaine(d, reponses),
  );

  let sommePonderee = 0;
  let sommePoids = 0;
  for (let i = 0; i < bareme.domaines.length; i++) {
    const domaine = bareme.domaines[i];
    const score = parDomaine[i];
    if (score.nbQuestionsRepondues === 0) continue;
    sommePonderee += score.pourcentage * domaine.poids;
    sommePoids += domaine.poids;
  }

  const pourcentage = sommePoids === 0 ? 0 : sommePonderee / sommePoids;
  return {
    pourcentage,
    parDomaine,
    palier: palierDepuisScore(bareme.paliers, pourcentage),
  };
}
