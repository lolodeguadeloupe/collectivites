import type { Domaine, Reponse, ScoreDomaine } from "@/lib/bareme";
import { calculerPointsReponse } from "./question";

export function calculerScoreDomaine(
  domaine: Domaine,
  reponses: Reponse[],
): ScoreDomaine {
  const parId = new Map(reponses.map((r) => [r.questionId, r]));

  let pointsObtenus = 0;
  let pointsMax = 0;
  let nbRepondues = 0;

  for (const q of domaine.questions) {
    const rep = parId.get(q.id);
    if (!rep) continue;
    pointsObtenus += calculerPointsReponse(q, rep.valeur);
    pointsMax += q.pointsMax;
    nbRepondues += 1;
  }

  const pourcentage = pointsMax === 0 ? 0 : (pointsObtenus / pointsMax) * 100;
  return {
    domaineId: domaine.id,
    pourcentage,
    pointsObtenus,
    pointsMax,
    nbQuestionsRepondues: nbRepondues,
  };
}
