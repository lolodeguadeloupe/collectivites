import type {
  ActionGeneree,
  Bareme,
  Reponse,
} from "@/lib/bareme";
import { siEstMatche } from "@/lib/alertes/detecter";

export function genererActions(
  bareme: Bareme,
  reponses: Reponse[],
): ActionGeneree[] {
  const parId = new Map(reponses.map((r) => [r.questionId, r]));
  const out: ActionGeneree[] = [];

  for (const domaine of bareme.domaines) {
    for (const q of domaine.questions) {
      const rep = parId.get(q.id);
      if (!rep || !q.actions) continue;
      for (const a of q.actions) {
        if (siEstMatche(a.si, rep.valeur)) {
          out.push({
            questionId: q.id,
            domaineId: domaine.id,
            libelle: a.libelle,
            priorite: a.priorite,
            effort: a.effort,
            budgetMin: a.budgetMin,
            budgetMax: a.budgetMax,
            ressourceUrl: a.ressourceUrl,
          });
        }
      }
    }
  }
  return out;
}
