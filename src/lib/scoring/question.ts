import type { Question, ReponseValeur } from "@/lib/bareme";

export function calculerPointsReponse(
  question: Question,
  valeur: ReponseValeur,
): number {
  if (question.type === "choix_multiple") {
    if (!Array.isArray(valeur)) {
      throw new Error(
        `La réponse à ${question.id} doit être un tableau (choix_multiple)`,
      );
    }
    let total = 0;
    for (const v of valeur) {
      const opt = question.options.find((o) => o.valeur === v);
      if (!opt) {
        throw new Error(
          `Valeur "${v}" inconnue pour la question ${question.id}`,
        );
      }
      total += opt.points;
    }
    return Math.min(total, question.pointsMax);
  }

  if (Array.isArray(valeur)) {
    throw new Error(
      `La réponse à ${question.id} doit être une chaîne`,
    );
  }
  const opt = question.options.find((o) => o.valeur === valeur);
  if (!opt) {
    throw new Error(
      `Valeur "${valeur}" inconnue pour la question ${question.id}`,
    );
  }
  return opt.points;
}
