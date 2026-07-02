import type { Palier } from "@/lib/bareme";

export function palierDepuisScore(paliers: Palier[], score: number): Palier {
  if (score < 0 || score > 100) {
    throw new Error(`Score ${score} hors de [0,100]`);
  }
  const s = Math.floor(score);
  const match = paliers.find((p) => s >= p.min && s <= p.max);
  if (!match) throw new Error(`Aucun palier trouvé pour le score ${score}`);
  return match;
}
