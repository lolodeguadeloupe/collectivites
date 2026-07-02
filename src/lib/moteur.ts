import path from "node:path";
import { chargerBareme } from "./bareme/loader";
import { calculerScoreGlobal } from "./scoring";
import { detecterAlertes } from "./alertes/detecter";
import { genererActions, trierActions } from "./actions";
import type {
  ActionGeneree,
  AlerteDetectee,
  Bareme,
  Reponse,
  ScoreGlobal,
} from "./bareme";

let baremeMemoize: Bareme | null = null;

export function getBareme(): Bareme {
  if (baremeMemoize) return baremeMemoize;
  const p =
    process.env.DIAGIT_BAREME_PATH ??
    path.join(process.cwd(), "config", "bareme.yaml");
  baremeMemoize = chargerBareme(p);
  return baremeMemoize;
}

export function evaluerDiagnostic(reponses: Reponse[]): {
  score: ScoreGlobal;
  alertes: AlerteDetectee[];
  actions: ActionGeneree[];
} {
  const bareme = getBareme();
  return {
    score: calculerScoreGlobal(bareme, reponses),
    alertes: detecterAlertes(bareme, reponses),
    actions: trierActions(genererActions(bareme, reponses)),
  };
}
