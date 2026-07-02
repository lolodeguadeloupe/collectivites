import { readFileSync } from "node:fs";
import { load as parseYaml } from "js-yaml";
import { baremeSchema } from "./schema";
import type { Bareme } from "./types";

export class BaremeInvalideError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BaremeInvalideError";
  }
}

export function chargerBareme(chemin: string): Bareme {
  const brut = readFileSync(chemin, "utf8");
  const parsed = parseYaml(brut);

  const result = baremeSchema.safeParse(parsed);
  if (!result.success) {
    const messages = result.error.issues.map((i) => {
      const p = i.path.join(".");
      return `- ${p || "(racine)"} : ${i.message}`;
    });
    throw new BaremeInvalideError(
      `Barème invalide :\n${messages.join("\n")}`,
    );
  }
  return result.data as Bareme;
}
