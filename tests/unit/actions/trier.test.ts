import { describe, it, expect } from "vitest";
import { trierActions } from "@/lib/actions/trier";
import type { ActionGeneree } from "@/lib/bareme";

const mk = (
  n: number,
  priorite: ActionGeneree["priorite"],
  effort: ActionGeneree["effort"],
): ActionGeneree => ({
  questionId: `D1Q${n}`,
  domaineId: "D1",
  libelle: `Action ${n}`,
  priorite,
  effort,
});

describe("trierActions", () => {
  it("sorts URGENT before COURT_TERME before MOYEN_TERME", () => {
    const sorted = trierActions([
      mk(1, "MOYEN_TERME", "FAIBLE"),
      mk(2, "URGENT", "MOYEN"),
      mk(3, "COURT_TERME", "FAIBLE"),
    ]);
    expect(sorted.map((a) => a.priorite)).toEqual([
      "URGENT",
      "COURT_TERME",
      "MOYEN_TERME",
    ]);
  });

  it("within the same priority, sorts by lowest effort first", () => {
    const sorted = trierActions([
      mk(1, "URGENT", "ELEVE"),
      mk(2, "URGENT", "FAIBLE"),
      mk(3, "URGENT", "MOYEN"),
    ]);
    expect(sorted.map((a) => a.effort)).toEqual([
      "FAIBLE",
      "MOYEN",
      "ELEVE",
    ]);
  });

  it("is stable for actions with identical priority and effort", () => {
    const input = [
      mk(1, "URGENT", "FAIBLE"),
      mk(2, "URGENT", "FAIBLE"),
      mk(3, "URGENT", "FAIBLE"),
    ];
    const sorted = trierActions(input);
    expect(sorted.map((a) => a.libelle)).toEqual([
      "Action 1",
      "Action 2",
      "Action 3",
    ]);
  });
});
