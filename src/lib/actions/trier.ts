import type { ActionGeneree } from "@/lib/bareme";

const RANG_PRIORITE: Record<ActionGeneree["priorite"], number> = {
  URGENT: 0,
  COURT_TERME: 1,
  MOYEN_TERME: 2,
};

const RANG_EFFORT: Record<ActionGeneree["effort"], number> = {
  FAIBLE: 0,
  MOYEN: 1,
  ELEVE: 2,
};

export function trierActions(actions: ActionGeneree[]): ActionGeneree[] {
  return [...actions]
    .map((a, i) => ({ a, i }))
    .sort((x, y) => {
      const dp = RANG_PRIORITE[x.a.priorite] - RANG_PRIORITE[y.a.priorite];
      if (dp !== 0) return dp;
      const de = RANG_EFFORT[x.a.effort] - RANG_EFFORT[y.a.effort];
      if (de !== 0) return de;
      return x.i - y.i;
    })
    .map(({ a }) => a);
}
