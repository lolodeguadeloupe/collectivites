import type {
  AlerteDetectee,
  Bareme,
  PredicatSi,
  Reponse,
  ReponseValeur,
} from "@/lib/bareme";

export function siEstMatche(
  si: PredicatSi,
  valeur: ReponseValeur,
): boolean {
  const cibles = Array.isArray(si) ? si : [si];
  if (Array.isArray(valeur)) {
    return valeur.some((v) => cibles.includes(v));
  }
  return cibles.includes(valeur);
}

export function detecterAlertes(
  bareme: Bareme,
  reponses: Reponse[],
): AlerteDetectee[] {
  const parId = new Map(reponses.map((r) => [r.questionId, r]));
  const out: AlerteDetectee[] = [];

  for (const domaine of bareme.domaines) {
    for (const q of domaine.questions) {
      const rep = parId.get(q.id);
      if (!rep || !q.alertes) continue;
      for (const a of q.alertes) {
        if (siEstMatche(a.si, rep.valeur)) {
          out.push({
            questionId: q.id,
            domaineId: domaine.id,
            libelle: a.libelle,
            gravite: a.gravite,
          });
        }
      }
    }
  }
  return out;
}
