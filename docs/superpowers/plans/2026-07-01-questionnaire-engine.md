# Questionnaire Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Depends on:** `2026-07-01-foundation.md` must be completed first. This plan assumes: Next.js 15 App Router + TypeScript, Prisma schema in place, Vitest configured, `config/` directory reserved.

**Goal:** Build the domain engine that (a) loads a versioned YAML *barème* (7 domains, ~34 questions in French), (b) computes domain + global scores with paliers, (c) detects blocking alerts, and (d) generates a prioritized action plan. Zero UI in this plan — the engine is exposed as pure TypeScript modules, unit-tested with Vitest.

**Architecture:**
- `config/bareme.yaml` — the single source of truth for questionnaire content, versioned in Git alongside the code but loaded at runtime so changes don't require a rebuild.
- `src/lib/bareme/` — types + Zod schema + loader. Validates on load; any invalid content throws with a French-language message.
- `src/lib/scoring/` — pure functions from `(bareme, reponses)` to numbers/paliers.
- `src/lib/alertes/` — pure function extracting blocking alerts.
- `src/lib/actions/` — pure function generating + sorting action items.
- Every module is a **pure function** taking data in and returning data out. No I/O beyond the initial YAML load. Testable in isolation with Vitest.

**Tech Stack:** TypeScript, `js-yaml`, Zod, Vitest.

---

## Data model — barème structure

The YAML shape (informative — enforced by the Zod schema in Task 2):

```yaml
version: "2026.1"
paliers:
  - { min: 0,  max: 39,  code: "critique",     libelle: "Critique",      couleur: "rouge"  }
  - { min: 40, max: 59,  code: "fragile",      libelle: "Fragile",       couleur: "orange" }
  - { min: 60, max: 79,  code: "enProgression",libelle: "En progression",couleur: "jaune"  }
  - { min: 80, max: 100, code: "solide",       libelle: "Solide",        couleur: "vert"   }
domaines:
  - id: "D1"
    libelle: "Inventaire et parc matériel"
    poids: 2
    questions:
      - id: "D1Q1"
        libelle: "…"
        aide: "…"
        type: "oui_non"        # oui_non | echelle_1_4 | choix_unique | choix_multiple
        pointsMax: 5
        options:
          - { valeur: "oui", libelle: "Oui", points: 5 }
          - { valeur: "non", libelle: "Non", points: 0 }
        alertes:
          - si: "non"
            libelle: "…"
            gravite: "rouge"   # rouge | orange
        actions:
          - si: "non"
            libelle: "…"
            priorite: "URGENT" # URGENT | COURT_TERME | MOYEN_TERME
            effort: "ELEVE"    # FAIBLE | MOYEN | ELEVE
            budgetMin: 500
            budgetMax: 2000
            ressourceUrl: "https://…"
```

**Response shape** (in TypeScript):

```ts
type ReponseValeur = string | string[]; // string[] only for choix_multiple
type Reponse = { questionId: string; valeur: ReponseValeur };
```

**Scoring rules:**
- `oui_non`, `echelle_1_4`, `choix_unique`: `points = options.find(o => o.valeur === valeur).points`.
- `choix_multiple`: sum points of every selected option, capped at `pointsMax`.
- A question with **no response** contributes 0 to both numerator and denominator (doesn't drag the score down or up).
- Domain score % = `sum(pointsObtenus of answered) / sum(pointsMax of answered) * 100`, `0` if no questions answered in the domain.
- Global score % = weighted average of domain scores by `domaine.poids`. Domains with no answers are excluded from the weighted average.

**Predicate model (for alertes/actions `si` field):**
- `si: "oui"` — matches if response value === `"oui"` (or, for `choix_multiple`, if `"oui"` is in the selected list).
- `si: ["1", "2"]` — matches if response value is one of `"1"` or `"2"` (or, for `choix_multiple`, if any is selected).

---

## File Structure

```
config/
└── bareme.yaml                          # versioned content

src/lib/
├── bareme/
│   ├── types.ts                         # exported TS types
│   ├── schema.ts                        # Zod schemas
│   ├── loader.ts                        # chargerBareme(path)
│   └── index.ts                         # re-exports
├── scoring/
│   ├── question.ts                      # calculerPointsReponse
│   ├── domaine.ts                       # calculerScoreDomaine
│   ├── global.ts                        # calculerScoreGlobal
│   ├── palier.ts                        # palierDepuisScore
│   └── index.ts
├── alertes/
│   └── detecter.ts                      # detecterAlertes
└── actions/
    ├── generer.ts                       # genererActions
    ├── trier.ts                         # trierActions
    └── index.ts

tests/unit/
├── bareme/
│   ├── loader.test.ts
│   └── fixtures/
│       └── bareme-test.yaml
├── scoring/
│   ├── question.test.ts
│   ├── domaine.test.ts
│   ├── global.test.ts
│   └── palier.test.ts
├── alertes/
│   └── detecter.test.ts
├── actions/
│   ├── generer.test.ts
│   └── trier.test.ts
└── integration/
    └── moteur.test.ts                    # end-to-end engine test
```

---

## Task 1: TypeScript types for the barème

**Files:**
- Create: `src/lib/bareme/types.ts`

- [ ] **Step 1: Write the types file**

Create `src/lib/bareme/types.ts`:

```ts
export type CouleurPalier = "rouge" | "orange" | "jaune" | "vert";
export type CodePalier =
  | "critique"
  | "fragile"
  | "enProgression"
  | "solide";

export type Palier = {
  min: number;
  max: number;
  code: CodePalier;
  libelle: string;
  couleur: CouleurPalier;
};

export type QuestionType =
  | "oui_non"
  | "echelle_1_4"
  | "choix_unique"
  | "choix_multiple";

export type Option = {
  valeur: string;
  libelle: string;
  points: number;
};

export type PredicatSi = string | string[];

export type GraviteAlerte = "rouge" | "orange";

export type AlerteDefinition = {
  si: PredicatSi;
  libelle: string;
  gravite: GraviteAlerte;
};

export type PrioriteAction = "URGENT" | "COURT_TERME" | "MOYEN_TERME";
export type EffortAction = "FAIBLE" | "MOYEN" | "ELEVE";

export type ActionDefinition = {
  si: PredicatSi;
  libelle: string;
  priorite: PrioriteAction;
  effort: EffortAction;
  budgetMin?: number;
  budgetMax?: number;
  ressourceUrl?: string;
};

export type Question = {
  id: string;
  libelle: string;
  aide: string;
  type: QuestionType;
  pointsMax: number;
  options: Option[];
  alertes?: AlerteDefinition[];
  actions?: ActionDefinition[];
};

export type Domaine = {
  id: string;
  libelle: string;
  poids: number;
  questions: Question[];
};

export type Bareme = {
  version: string;
  paliers: Palier[];
  domaines: Domaine[];
};

// ---- Runtime / response types ---------------------------------------------

export type ReponseValeur = string | string[];

export type Reponse = {
  questionId: string;
  valeur: ReponseValeur;
};

export type ScoreDomaine = {
  domaineId: string;
  pourcentage: number; // 0..100
  pointsObtenus: number;
  pointsMax: number;
  nbQuestionsRepondues: number;
};

export type ScoreGlobal = {
  pourcentage: number; // 0..100
  parDomaine: ScoreDomaine[];
  palier: Palier;
};

export type AlerteDetectee = {
  questionId: string;
  domaineId: string;
  libelle: string;
  gravite: GraviteAlerte;
};

export type ActionGeneree = {
  questionId: string;
  domaineId: string;
  libelle: string;
  priorite: PrioriteAction;
  effort: EffortAction;
  budgetMin?: number;
  budgetMax?: number;
  ressourceUrl?: string;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/bareme/types.ts
git commit -m "feat(bareme): TypeScript domain types"
```

---

## Task 2: Zod schema for barème validation

**Files:**
- Create: `src/lib/bareme/schema.ts`
- Modify: `package.json`

- [ ] **Step 1: Confirm Zod is installed**

Plan 1 already installed Zod. Verify:

```bash
node -e "console.log(require('zod').z.string)"
```

Expected: `[Function: string]`. If not, `npm install zod`.

- [ ] **Step 2: Write the Zod schema**

Create `src/lib/bareme/schema.ts`:

```ts
import { z } from "zod";

const optionSchema = z.object({
  valeur: z.string().min(1),
  libelle: z.string().min(1),
  points: z.number().min(0),
});

const predicatSiSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1),
]);

const alerteSchema = z.object({
  si: predicatSiSchema,
  libelle: z.string().min(1),
  gravite: z.enum(["rouge", "orange"]),
});

const actionSchema = z.object({
  si: predicatSiSchema,
  libelle: z.string().min(1),
  priorite: z.enum(["URGENT", "COURT_TERME", "MOYEN_TERME"]),
  effort: z.enum(["FAIBLE", "MOYEN", "ELEVE"]),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
  ressourceUrl: z.string().url().optional(),
});

const questionTypeSchema = z.enum([
  "oui_non",
  "echelle_1_4",
  "choix_unique",
  "choix_multiple",
]);

const questionSchema = z
  .object({
    id: z.string().regex(/^[A-Z0-9]+Q\d+$/, "id doit ressembler à 'D1Q3'"),
    libelle: z.string().min(1),
    aide: z.string().min(1),
    type: questionTypeSchema,
    pointsMax: z.number().positive(),
    options: z.array(optionSchema).min(2),
    alertes: z.array(alerteSchema).optional(),
    actions: z.array(actionSchema).optional(),
  })
  .superRefine((q, ctx) => {
    // Every option's points must be within [0, pointsMax].
    for (const o of q.options) {
      if (o.points > q.pointsMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Option "${o.valeur}" a ${o.points} points, > pointsMax=${q.pointsMax}`,
        });
      }
    }
    // Type-specific shape constraints.
    const valeurs = q.options.map((o) => o.valeur);
    if (q.type === "oui_non") {
      const expected = ["oui", "non"];
      if (
        valeurs.length !== 2 ||
        !expected.every((v) => valeurs.includes(v))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `oui_non doit avoir exactement les valeurs "oui" et "non"`,
        });
      }
    }
    if (q.type === "echelle_1_4") {
      const expected = ["1", "2", "3", "4"];
      if (
        valeurs.length !== 4 ||
        !expected.every((v) => valeurs.includes(v))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `echelle_1_4 doit avoir exactement les valeurs "1","2","3","4"`,
        });
      }
    }
    // Unique valeurs
    if (new Set(valeurs).size !== valeurs.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Les valeurs des options doivent être uniques`,
      });
    }
  });

const domaineSchema = z.object({
  id: z.string().regex(/^D\d+$/, "id de domaine doit ressembler à 'D3'"),
  libelle: z.string().min(1),
  poids: z.number().positive(),
  questions: z.array(questionSchema).min(1),
});

const palierSchema = z
  .object({
    min: z.number().int().min(0).max(100),
    max: z.number().int().min(0).max(100),
    code: z.enum(["critique", "fragile", "enProgression", "solide"]),
    libelle: z.string().min(1),
    couleur: z.enum(["rouge", "orange", "jaune", "vert"]),
  })
  .refine((p) => p.min <= p.max, { message: "min doit être ≤ max" });

export const baremeSchema = z
  .object({
    version: z.string().min(1),
    paliers: z.array(palierSchema).min(1),
    domaines: z.array(domaineSchema).min(1),
  })
  .superRefine((b, ctx) => {
    // Paliers must cover 0..100 contiguously without overlap.
    const sorted = [...b.paliers].sort((a, z) => a.min - z.min);
    if (sorted[0].min !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Les paliers doivent commencer à 0 (trouvé ${sorted[0].min})`,
      });
    }
    if (sorted[sorted.length - 1].max !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Les paliers doivent finir à 100 (trouvé ${sorted[sorted.length - 1].max})`,
      });
    }
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].min !== sorted[i - 1].max + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Trou ou chevauchement entre paliers ${sorted[i - 1].code} et ${sorted[i].code}`,
        });
      }
    }
    // Unique IDs across all questions.
    const allIds = b.domaines.flatMap((d) => d.questions.map((q) => q.id));
    if (new Set(allIds).size !== allIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Les identifiants de questions doivent être uniques`,
      });
    }
  });

export type BaremeInput = z.infer<typeof baremeSchema>;
```

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/bareme/schema.ts
git commit -m "feat(bareme): Zod schema with structural validation"
```

---

## Task 3: YAML loader (TDD)

**Files:**
- Create: `src/lib/bareme/loader.ts`, `src/lib/bareme/index.ts`, `tests/unit/bareme/loader.test.ts`, `tests/unit/bareme/fixtures/bareme-test.yaml`, `tests/unit/bareme/fixtures/bareme-invalide.yaml`
- Modify: `package.json`

- [ ] **Step 1: Install `js-yaml`**

```bash
npm install js-yaml
npm install -D @types/js-yaml
```

- [ ] **Step 2: Create a minimal valid fixture**

Create `tests/unit/bareme/fixtures/bareme-test.yaml`:

```yaml
version: "test-1.0"
paliers:
  - { min: 0,  max: 39,  code: "critique",     libelle: "Critique",      couleur: "rouge"  }
  - { min: 40, max: 59,  code: "fragile",      libelle: "Fragile",       couleur: "orange" }
  - { min: 60, max: 79,  code: "enProgression",libelle: "En progression",couleur: "jaune"  }
  - { min: 80, max: 100, code: "solide",       libelle: "Solide",        couleur: "vert"   }
domaines:
  - id: "D1"
    libelle: "Domaine de test"
    poids: 1
    questions:
      - id: "D1Q1"
        libelle: "Question test ?"
        aide: "Aide test."
        type: "oui_non"
        pointsMax: 5
        options:
          - { valeur: "oui", libelle: "Oui", points: 5 }
          - { valeur: "non", libelle: "Non", points: 0 }
        alertes:
          - { si: "non", libelle: "Alerte test", gravite: "rouge" }
        actions:
          - si: "non"
            libelle: "Action test"
            priorite: "URGENT"
            effort: "FAIBLE"
```

- [ ] **Step 3: Create an intentionally invalid fixture**

Create `tests/unit/bareme/fixtures/bareme-invalide.yaml`:

```yaml
version: "invalide-1.0"
paliers:
  - { min: 0,  max: 39,  code: "critique",     libelle: "Critique",      couleur: "rouge"  }
  # Trou : palier suivant devrait commencer à 40, pas 50.
  - { min: 50, max: 100, code: "solide",       libelle: "Solide",        couleur: "vert"   }
domaines:
  - id: "D1"
    libelle: "Domaine"
    poids: 1
    questions:
      - id: "D1Q1"
        libelle: "Q ?"
        aide: "A"
        type: "oui_non"
        pointsMax: 5
        options:
          - { valeur: "oui", libelle: "Oui", points: 10 }  # > pointsMax
          - { valeur: "non", libelle: "Non", points: 0 }
```

- [ ] **Step 4: Write failing tests**

Create `tests/unit/bareme/loader.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import path from "node:path";
import { chargerBareme, BaremeInvalideError } from "@/lib/bareme/loader";

const FIXTURE_VALIDE = path.join(
  __dirname,
  "fixtures",
  "bareme-test.yaml",
);
const FIXTURE_INVALIDE = path.join(
  __dirname,
  "fixtures",
  "bareme-invalide.yaml",
);

describe("chargerBareme", () => {
  it("loads and validates a well-formed YAML file", () => {
    const b = chargerBareme(FIXTURE_VALIDE);
    expect(b.version).toBe("test-1.0");
    expect(b.paliers).toHaveLength(4);
    expect(b.domaines).toHaveLength(1);
    expect(b.domaines[0].questions[0].id).toBe("D1Q1");
  });

  it("throws BaremeInvalideError with French message on structural errors", () => {
    expect(() => chargerBareme(FIXTURE_INVALIDE)).toThrow(BaremeInvalideError);
    try {
      chargerBareme(FIXTURE_INVALIDE);
    } catch (e) {
      expect(e).toBeInstanceOf(BaremeInvalideError);
      const msg = (e as Error).message;
      // Both structural issues should be flagged.
      expect(msg).toMatch(/pointsMax/);
      expect(msg).toMatch(/palier/i);
    }
  });

  it("throws if the file does not exist", () => {
    expect(() => chargerBareme("/tmp/does-not-exist.yaml")).toThrow();
  });
});
```

- [ ] **Step 5: Run — expect fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '@/lib/bareme/loader'`.

- [ ] **Step 6: Implement the loader**

Create `src/lib/bareme/loader.ts`:

```ts
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
```

- [ ] **Step 7: Create the public re-export**

Create `src/lib/bareme/index.ts`:

```ts
export * from "./types";
export { chargerBareme, BaremeInvalideError } from "./loader";
```

- [ ] **Step 8: Run — expect pass**

```bash
npm test
```

Expected: all bareme tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/lib/bareme tests/unit/bareme package.json package-lock.json
git commit -m "feat(bareme): YAML loader with Zod validation and French errors"
```

---

## Task 4: Per-question point calculator (TDD)

**Files:**
- Create: `src/lib/scoring/question.ts`, `tests/unit/scoring/question.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/scoring/question.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { calculerPointsReponse } from "@/lib/scoring/question";
import type { Question } from "@/lib/bareme";

const questionOuiNon: Question = {
  id: "D1Q1",
  libelle: "Q ?",
  aide: "A",
  type: "oui_non",
  pointsMax: 5,
  options: [
    { valeur: "oui", libelle: "Oui", points: 5 },
    { valeur: "non", libelle: "Non", points: 0 },
  ],
};

const questionEchelle: Question = {
  id: "D1Q2",
  libelle: "Q ?",
  aide: "A",
  type: "echelle_1_4",
  pointsMax: 4,
  options: [
    { valeur: "1", libelle: "1", points: 0 },
    { valeur: "2", libelle: "2", points: 1 },
    { valeur: "3", libelle: "3", points: 3 },
    { valeur: "4", libelle: "4", points: 4 },
  ],
};

const questionChoixMultiple: Question = {
  id: "D1Q3",
  libelle: "Q ?",
  aide: "A",
  type: "choix_multiple",
  pointsMax: 5,
  options: [
    { valeur: "aucun", libelle: "Aucun", points: 5 },
    { valeur: "rdp", libelle: "RDP", points: 0 },
    { valeur: "fichiers", libelle: "Partage de fichiers", points: 0 },
    { valeur: "web", libelle: "Site web interne", points: 2 },
  ],
};

describe("calculerPointsReponse", () => {
  it("returns the option's points for oui_non", () => {
    expect(calculerPointsReponse(questionOuiNon, "oui")).toBe(5);
    expect(calculerPointsReponse(questionOuiNon, "non")).toBe(0);
  });

  it("returns the option's points for echelle_1_4", () => {
    expect(calculerPointsReponse(questionEchelle, "3")).toBe(3);
    expect(calculerPointsReponse(questionEchelle, "1")).toBe(0);
  });

  it("sums selected options for choix_multiple, capped at pointsMax", () => {
    expect(calculerPointsReponse(questionChoixMultiple, ["aucun"])).toBe(5);
    expect(
      calculerPointsReponse(questionChoixMultiple, ["rdp", "fichiers"]),
    ).toBe(0);
    // 5 (aucun) + 2 (web) = 7, cap at pointsMax=5
    expect(
      calculerPointsReponse(questionChoixMultiple, ["aucun", "web"]),
    ).toBe(5);
  });

  it("returns 0 for choix_multiple with empty selection", () => {
    expect(calculerPointsReponse(questionChoixMultiple, [])).toBe(0);
  });

  it("throws if the response value doesn't match any option", () => {
    expect(() => calculerPointsReponse(questionOuiNon, "peut-etre")).toThrow(
      /valeur/i,
    );
  });

  it("throws if the response shape doesn't match the question type", () => {
    // choix_multiple expects string[], not string
    expect(() =>
      calculerPointsReponse(questionChoixMultiple, "aucun"),
    ).toThrow(/tableau/i);
    // oui_non expects string, not string[]
    expect(() => calculerPointsReponse(questionOuiNon, ["oui"])).toThrow(
      /chaîne/i,
    );
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test
```

Expected: `Cannot find module '@/lib/scoring/question'`.

- [ ] **Step 3: Implement**

Create `src/lib/scoring/question.ts`:

```ts
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

  // oui_non, echelle_1_4, choix_unique
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring/question.ts tests/unit/scoring/question.test.ts
git commit -m "feat(scoring): per-question point calculator with type validation"
```

---

## Task 5: Domain scorer (TDD)

**Files:**
- Create: `src/lib/scoring/domaine.ts`, `tests/unit/scoring/domaine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/scoring/domaine.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { calculerScoreDomaine } from "@/lib/scoring/domaine";
import type { Domaine, Reponse } from "@/lib/bareme";

const domaine: Domaine = {
  id: "D1",
  libelle: "Test",
  poids: 1,
  questions: [
    {
      id: "D1Q1",
      libelle: "Q1", aide: "A", type: "oui_non", pointsMax: 5,
      options: [
        { valeur: "oui", libelle: "Oui", points: 5 },
        { valeur: "non", libelle: "Non", points: 0 },
      ],
    },
    {
      id: "D1Q2",
      libelle: "Q2", aide: "A", type: "oui_non", pointsMax: 10,
      options: [
        { valeur: "oui", libelle: "Oui", points: 10 },
        { valeur: "non", libelle: "Non", points: 0 },
      ],
    },
  ],
};

describe("calculerScoreDomaine", () => {
  it("returns 100% when every question is answered with the best option", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D1Q2", valeur: "oui" },
    ];
    const s = calculerScoreDomaine(domaine, reponses);
    expect(s.pourcentage).toBe(100);
    expect(s.pointsObtenus).toBe(15);
    expect(s.pointsMax).toBe(15);
    expect(s.nbQuestionsRepondues).toBe(2);
  });

  it("returns 0% when every question is answered with the worst option", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "non" },
      { questionId: "D1Q2", valeur: "non" },
    ];
    expect(calculerScoreDomaine(domaine, reponses).pourcentage).toBe(0);
  });

  it("weights by pointsMax (5+0)/(5+10) = 33%", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D1Q2", valeur: "non" },
    ];
    const s = calculerScoreDomaine(domaine, reponses);
    expect(s.pourcentage).toBeCloseTo((5 / 15) * 100, 2);
  });

  it("excludes unanswered questions from both numerator and denominator", () => {
    const reponses: Reponse[] = [{ questionId: "D1Q1", valeur: "oui" }];
    const s = calculerScoreDomaine(domaine, reponses);
    expect(s.pourcentage).toBe(100);
    expect(s.pointsMax).toBe(5);
    expect(s.nbQuestionsRepondues).toBe(1);
  });

  it("returns 0% with no answers at all", () => {
    const s = calculerScoreDomaine(domaine, []);
    expect(s.pourcentage).toBe(0);
    expect(s.pointsMax).toBe(0);
    expect(s.nbQuestionsRepondues).toBe(0);
  });

  it("ignores responses that reference an unknown question in this domain", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D9Q9", valeur: "oui" }, // not in this domain
    ];
    const s = calculerScoreDomaine(domaine, reponses);
    expect(s.nbQuestionsRepondues).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/scoring/domaine.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring/domaine.ts tests/unit/scoring/domaine.test.ts
git commit -m "feat(scoring): domain-level score calculator"
```

---

## Task 6: Palier classifier (TDD)

**Files:**
- Create: `src/lib/scoring/palier.ts`, `tests/unit/scoring/palier.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/scoring/palier.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { palierDepuisScore } from "@/lib/scoring/palier";
import type { Palier } from "@/lib/bareme";

const paliers: Palier[] = [
  { min: 0,  max: 39,  code: "critique",     libelle: "Critique",      couleur: "rouge"  },
  { min: 40, max: 59,  code: "fragile",      libelle: "Fragile",       couleur: "orange" },
  { min: 60, max: 79,  code: "enProgression",libelle: "En progression",couleur: "jaune"  },
  { min: 80, max: 100, code: "solide",       libelle: "Solide",        couleur: "vert"   },
];

describe("palierDepuisScore", () => {
  it.each([
    [0, "critique"],
    [39, "critique"],
    [40, "fragile"],
    [59, "fragile"],
    [60, "enProgression"],
    [79, "enProgression"],
    [80, "solide"],
    [100, "solide"],
    [39.9, "critique"],
    [40.0001, "fragile"],
  ])("score %s -> %s", (score, code) => {
    expect(palierDepuisScore(paliers, score).code).toBe(code);
  });

  it("throws for scores outside [0,100]", () => {
    expect(() => palierDepuisScore(paliers, -1)).toThrow();
    expect(() => palierDepuisScore(paliers, 101)).toThrow();
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

Create `src/lib/scoring/palier.ts`:

```ts
import type { Palier } from "@/lib/bareme";

export function palierDepuisScore(paliers: Palier[], score: number): Palier {
  if (score < 0 || score > 100) {
    throw new Error(`Score ${score} hors de [0,100]`);
  }
  // Paliers are inclusive at both ends after normalization: [min, max].
  // For fractional scores that fall between two paliers (e.g. 39.5),
  // we round down: 39.5 -> 39 -> "critique".
  const s = Math.floor(score);
  const match = paliers.find((p) => s >= p.min && s <= p.max);
  if (!match) throw new Error(`Aucun palier trouvé pour le score ${score}`);
  return match;
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring/palier.ts tests/unit/scoring/palier.test.ts
git commit -m "feat(scoring): palier classifier"
```

---

## Task 7: Global weighted score (TDD)

**Files:**
- Create: `src/lib/scoring/global.ts`, `src/lib/scoring/index.ts`, `tests/unit/scoring/global.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/scoring/global.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { calculerScoreGlobal } from "@/lib/scoring/global";
import type { Bareme, Reponse } from "@/lib/bareme";

const bareme: Bareme = {
  version: "test",
  paliers: [
    { min: 0,  max: 39,  code: "critique",     libelle: "Critique",      couleur: "rouge"  },
    { min: 40, max: 59,  code: "fragile",      libelle: "Fragile",       couleur: "orange" },
    { min: 60, max: 79,  code: "enProgression",libelle: "En progression",couleur: "jaune"  },
    { min: 80, max: 100, code: "solide",       libelle: "Solide",        couleur: "vert"   },
  ],
  domaines: [
    {
      id: "D1", libelle: "D1", poids: 1,
      questions: [{
        id: "D1Q1", libelle: "Q", aide: "A", type: "oui_non", pointsMax: 10,
        options: [
          { valeur: "oui", libelle: "Oui", points: 10 },
          { valeur: "non", libelle: "Non", points: 0 },
        ],
      }],
    },
    {
      id: "D2", libelle: "D2", poids: 3, // weighted 3x
      questions: [{
        id: "D2Q1", libelle: "Q", aide: "A", type: "oui_non", pointsMax: 10,
        options: [
          { valeur: "oui", libelle: "Oui", points: 10 },
          { valeur: "non", libelle: "Non", points: 0 },
        ],
      }],
    },
  ],
};

describe("calculerScoreGlobal", () => {
  it("returns 100% with all-best answers", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D2Q1", valeur: "oui" },
    ];
    const s = calculerScoreGlobal(bareme, reponses);
    expect(s.pourcentage).toBe(100);
    expect(s.palier.code).toBe("solide");
    expect(s.parDomaine).toHaveLength(2);
  });

  it("weights D2 (poids=3) higher than D1 (poids=1): D1=100, D2=0 -> 25%", () => {
    const reponses: Reponse[] = [
      { questionId: "D1Q1", valeur: "oui" },
      { questionId: "D2Q1", valeur: "non" },
    ];
    const s = calculerScoreGlobal(bareme, reponses);
    expect(s.pourcentage).toBeCloseTo((100 * 1 + 0 * 3) / (1 + 3), 2);
    expect(s.palier.code).toBe("critique");
  });

  it("excludes domains with no answers from the weighted average", () => {
    const reponses: Reponse[] = [{ questionId: "D1Q1", valeur: "oui" }];
    const s = calculerScoreGlobal(bareme, reponses);
    expect(s.pourcentage).toBe(100);
    expect(s.parDomaine.find((d) => d.domaineId === "D2")?.pointsMax).toBe(0);
  });

  it("returns 0% with no answers at all", () => {
    const s = calculerScoreGlobal(bareme, []);
    expect(s.pourcentage).toBe(0);
    expect(s.palier.code).toBe("critique");
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

Create `src/lib/scoring/global.ts`:

```ts
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
```

- [ ] **Step 4: Create the scoring re-export**

Create `src/lib/scoring/index.ts`:

```ts
export { calculerPointsReponse } from "./question";
export { calculerScoreDomaine } from "./domaine";
export { calculerScoreGlobal } from "./global";
export { palierDepuisScore } from "./palier";
```

- [ ] **Step 5: Run — expect pass**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/scoring/global.ts src/lib/scoring/index.ts tests/unit/scoring/global.test.ts
git commit -m "feat(scoring): global weighted score with palier"
```

---

## Task 8: Blocking alert detector (TDD)

**Files:**
- Create: `src/lib/alertes/detecter.ts`, `tests/unit/alertes/detecter.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/alertes/detecter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { detecterAlertes } from "@/lib/alertes/detecter";
import type { Bareme, Reponse } from "@/lib/bareme";

const bareme: Bareme = {
  version: "test",
  paliers: [
    { min: 0, max: 39, code: "critique", libelle: "C", couleur: "rouge" },
    { min: 40, max: 59, code: "fragile", libelle: "F", couleur: "orange" },
    { min: 60, max: 79, code: "enProgression", libelle: "E", couleur: "jaune" },
    { min: 80, max: 100, code: "solide", libelle: "S", couleur: "vert" },
  ],
  domaines: [
    {
      id: "D3", libelle: "Sauvegarde", poids: 3,
      questions: [
        {
          id: "D3Q4", libelle: "Test de restauration ?", aide: "…",
          type: "oui_non", pointsMax: 5,
          options: [
            { valeur: "oui", libelle: "Oui", points: 5 },
            { valeur: "non", libelle: "Non", points: 0 },
          ],
          alertes: [
            {
              si: "non",
              libelle: "Aucune restauration testée — risque majeur",
              gravite: "rouge",
            },
          ],
        },
      ],
    },
    {
      id: "D2", libelle: "Sécurité", poids: 3,
      questions: [
        {
          id: "D2Q5", libelle: "Services exposés ?", aide: "…",
          type: "choix_multiple", pointsMax: 5,
          options: [
            { valeur: "aucun", libelle: "Aucun", points: 5 },
            { valeur: "rdp", libelle: "RDP", points: 0 },
            { valeur: "fichiers", libelle: "Partage fichiers", points: 0 },
          ],
          alertes: [
            {
              si: ["rdp", "fichiers"],
              libelle: "Service exposé sans protection",
              gravite: "rouge",
            },
          ],
        },
      ],
    },
  ],
};

describe("detecterAlertes", () => {
  it("triggers a rouge alert when response matches si", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D3Q4", valeur: "non" },
    ]);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].gravite).toBe("rouge");
    expect(alertes[0].domaineId).toBe("D3");
    expect(alertes[0].questionId).toBe("D3Q4");
  });

  it("does not trigger when response doesn't match si", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D3Q4", valeur: "oui" },
    ]);
    expect(alertes).toHaveLength(0);
  });

  it("triggers for choix_multiple when any array element matches an si list", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D2Q5", valeur: ["rdp"] },
    ]);
    expect(alertes).toHaveLength(1);
  });

  it("does not trigger choix_multiple when 'aucun' is selected", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D2Q5", valeur: ["aucun"] },
    ]);
    expect(alertes).toHaveLength(0);
  });

  it("does not trigger for unanswered questions", () => {
    const alertes = detecterAlertes(bareme, []);
    expect(alertes).toHaveLength(0);
  });

  it("returns alerts in the order domain -> question -> alerte declaration", () => {
    const alertes = detecterAlertes(bareme, [
      { questionId: "D2Q5", valeur: ["rdp"] },
      { questionId: "D3Q4", valeur: "non" },
    ]);
    // D3 declared before D2 in bareme.domaines -> D3 alert first.
    expect(alertes.map((a) => a.domaineId)).toEqual(["D3", "D2"]);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

Create `src/lib/alertes/detecter.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/alertes tests/unit/alertes
git commit -m "feat(alertes): blocking alert detector with 'si' predicates"
```

---

## Task 9: Action generator (TDD)

**Files:**
- Create: `src/lib/actions/generer.ts`, `tests/unit/actions/generer.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/actions/generer.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { genererActions } from "@/lib/actions/generer";
import type { Bareme, Reponse } from "@/lib/bareme";

const bareme: Bareme = {
  version: "test",
  paliers: [
    { min: 0, max: 39, code: "critique", libelle: "C", couleur: "rouge" },
    { min: 40, max: 59, code: "fragile", libelle: "F", couleur: "orange" },
    { min: 60, max: 79, code: "enProgression", libelle: "E", couleur: "jaune" },
    { min: 80, max: 100, code: "solide", libelle: "S", couleur: "vert" },
  ],
  domaines: [
    {
      id: "D3", libelle: "Sauvegarde", poids: 3,
      questions: [
        {
          id: "D3Q1", libelle: "Sauvegardes ?", aide: "…",
          type: "oui_non", pointsMax: 5,
          options: [
            { valeur: "oui", libelle: "Oui", points: 5 },
            { valeur: "non", libelle: "Non", points: 0 },
          ],
          actions: [
            {
              si: "non",
              libelle: "Mettre en place une sauvegarde externalisée",
              priorite: "URGENT",
              effort: "MOYEN",
              budgetMin: 500,
              budgetMax: 2000,
              ressourceUrl: "https://cyber.gouv.fr/sauvegardes",
            },
          ],
        },
      ],
    },
  ],
};

describe("genererActions", () => {
  it("produces an action when a matching response is given", () => {
    const actions = genererActions(bareme, [
      { questionId: "D3Q1", valeur: "non" },
    ]);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      questionId: "D3Q1",
      domaineId: "D3",
      priorite: "URGENT",
      effort: "MOYEN",
      budgetMin: 500,
      budgetMax: 2000,
      ressourceUrl: "https://cyber.gouv.fr/sauvegardes",
    });
    expect(actions[0].libelle).toContain("sauvegarde");
  });

  it("produces no actions when responses don't match", () => {
    const actions = genererActions(bareme, [
      { questionId: "D3Q1", valeur: "oui" },
    ]);
    expect(actions).toHaveLength(0);
  });

  it("produces no actions for unanswered questions", () => {
    expect(genererActions(bareme, [])).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

Create `src/lib/actions/generer.ts`:

```ts
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
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/generer.ts tests/unit/actions/generer.test.ts
git commit -m "feat(actions): action generator triggered by response predicates"
```

---

## Task 10: Action sorter (TDD)

**Files:**
- Create: `src/lib/actions/trier.ts`, `src/lib/actions/index.ts`, `tests/unit/actions/trier.test.ts`

Priority order (from PRD § 6): urgent > court terme > moyen terme. Within a priority, best impact/effort ratio first — approximated as *lowest effort first* (a URGENT + FAIBLE effort action is a quick win).

- [ ] **Step 1: Write failing tests**

Create `tests/unit/actions/trier.test.ts`:

```ts
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
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test
```

- [ ] **Step 3: Implement**

Create `src/lib/actions/trier.ts`:

```ts
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
      return x.i - y.i; // stable
    })
    .map(({ a }) => a);
}
```

- [ ] **Step 4: Create the actions re-export**

Create `src/lib/actions/index.ts`:

```ts
export { genererActions } from "./generer";
export { trierActions } from "./trier";
```

- [ ] **Step 5: Run — expect pass**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions/trier.ts src/lib/actions/index.ts tests/unit/actions/trier.test.ts
git commit -m "feat(actions): priority + effort sorter, stable"
```

---

## Task 11: Author the full 7-domain barème in French

**Files:**
- Create: `config/bareme.yaml`

This task is content-heavy. The YAML below is the v1 barème. It uses the shape validated by Task 2's schema and is designed to complete in <45 minutes (§ 2 PRD objective).

- [ ] **Step 1: Create `config/bareme.yaml`**

Write the file exactly as follows. Do not paraphrase the French — it has been tuned for non-technicians and matches PRD § 4.

```yaml
version: "2026.1"

paliers:
  - { min: 0,  max: 39,  code: "critique",      libelle: "Critique",       couleur: "rouge"  }
  - { min: 40, max: 59,  code: "fragile",       libelle: "Fragile",        couleur: "orange" }
  - { min: 60, max: 79,  code: "enProgression", libelle: "En progression", couleur: "jaune"  }
  - { min: 80, max: 100, code: "solide",        libelle: "Solide",         couleur: "vert"   }

domaines:

  # ---------- D1 — Inventaire et parc matériel ----------
  - id: "D1"
    libelle: "Inventaire et parc matériel"
    poids: 2
    questions:
      - id: "D1Q1"
        libelle: "Combien de postes de travail (ordinateurs) sont utilisés au quotidien ?"
        aide: "Comptez les postes fixes et portables réellement utilisés par les agents et les élus."
        type: "choix_unique"
        pointsMax: 1
        options:
          - { valeur: "1_5",   libelle: "1 à 5",    points: 1 }
          - { valeur: "6_20",  libelle: "6 à 20",   points: 1 }
          - { valeur: "21_50", libelle: "21 à 50",  points: 1 }
          - { valeur: "50p",   libelle: "Plus de 50", points: 1 }

      - id: "D1Q2"
        libelle: "Disposez-vous d'un inventaire à jour du matériel informatique ?"
        aide: "Un fichier, même simple (tableur), listant les postes, leurs utilisateurs, leurs numéros de série."
        type: "oui_non"
        pointsMax: 3
        options:
          - { valeur: "oui", libelle: "Oui", points: 3 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Créer un inventaire des postes (utilisateur, système, âge)"
            priorite: "COURT_TERME"
            effort: "FAIBLE"

      - id: "D1Q3"
        libelle: "Y a-t-il des postes qui utilisent encore Windows 7, Windows 8, ou un système d'exploitation plus ancien ?"
        aide: "Windows 7 et 8 ne reçoivent plus de correctifs de sécurité et sont une porte d'entrée pour les attaques."
        type: "oui_non"
        pointsMax: 5
        options:
          - { valeur: "oui", libelle: "Oui", points: 0 }
          - { valeur: "non", libelle: "Non", points: 5 }
        alertes:
          - si: "oui"
            libelle: "Systèmes d'exploitation en fin de support en production"
            gravite: "rouge"
        actions:
          - si: "oui"
            libelle: "Remplacer ou migrer les postes en fin de support"
            priorite: "URGENT"
            effort: "ELEVE"
            budgetMin: 500
            budgetMax: 1500
            ressourceUrl: "https://cyber.gouv.fr/publications/mettre-en-oeuvre-un-systeme-dexploitation-supporte"

      - id: "D1Q4"
        libelle: "Les logiciels métier critiques (état civil, urbanisme, comptabilité, paie) sont-ils identifiés et documentés ?"
        aide: "Une liste, même informelle, indiquant pour chaque logiciel : l'éditeur, la version, le prestataire de support."
        type: "oui_non"
        pointsMax: 3
        options:
          - { valeur: "oui", libelle: "Oui", points: 3 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Cartographier les logiciels métier critiques (éditeur, version, contact support)"
            priorite: "COURT_TERME"
            effort: "FAIBLE"

      - id: "D1Q5"
        libelle: "Disposez-vous d'un ou plusieurs serveurs installés dans la mairie ?"
        aide: "Un serveur physique dans un local, ou une machine virtuelle hébergée localement."
        type: "oui_non"
        pointsMax: 1
        options:
          - { valeur: "oui", libelle: "Oui", points: 1 }
          - { valeur: "non", libelle: "Non", points: 1 }

  # ---------- D2 — Sécurité et protection ----------
  - id: "D2"
    libelle: "Sécurité et protection"
    poids: 5
    questions:
      - id: "D2Q1"
        libelle: "Un antivirus (ou EDR) est-il installé sur tous les postes ?"
        aide: "Windows Defender activé compte. Attention aux postes personnels utilisés pour le travail."
        type: "oui_non"
        pointsMax: 5
        options:
          - { valeur: "oui", libelle: "Oui", points: 5 }
          - { valeur: "non", libelle: "Non", points: 0 }
        alertes:
          - si: "non"
            libelle: "Aucun antivirus sur certains postes"
            gravite: "rouge"
        actions:
          - si: "non"
            libelle: "Activer un antivirus sur tous les postes (Defender minimum)"
            priorite: "URGENT"
            effort: "FAIBLE"

      - id: "D2Q2"
        libelle: "Les mises à jour de sécurité (Windows, logiciels) sont-elles appliquées régulièrement ?"
        aide: "1 = jamais / je ne sais pas, 4 = automatiquement dès qu'elles sortent."
        type: "echelle_1_4"
        pointsMax: 4
        options:
          - { valeur: "1", libelle: "Jamais / je ne sais pas", points: 0 }
          - { valeur: "2", libelle: "Rarement", points: 1 }
          - { valeur: "3", libelle: "Régulièrement", points: 3 }
          - { valeur: "4", libelle: "Automatiquement", points: 4 }
        actions:
          - si: ["1", "2"]
            libelle: "Activer les mises à jour automatiques de Windows et des logiciels critiques"
            priorite: "URGENT"
            effort: "FAIBLE"

      - id: "D2Q3"
        libelle: "Une politique de mots de passe robustes est-elle en place (12 caractères minimum, unique par service) ?"
        aide: "Un gestionnaire de mots de passe (KeePass, Bitwarden) compte comme une politique en place."
        type: "oui_non"
        pointsMax: 4
        options:
          - { valeur: "oui", libelle: "Oui", points: 4 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Adopter une politique de mots de passe (12+ caractères, gestionnaire)"
            priorite: "COURT_TERME"
            effort: "FAIBLE"
            ressourceUrl: "https://cyber.gouv.fr/publications/recommandations-relatives-lauthentification-multifacteur-et-aux-mots-de-passe"

      - id: "D2Q4"
        libelle: "L'authentification à deux facteurs (2FA) est-elle activée pour les comptes sensibles (messagerie, logiciels métier, administration) ?"
        aide: "SMS, application (Google/Microsoft Authenticator), ou clé de sécurité physique."
        type: "oui_non"
        pointsMax: 5
        options:
          - { valeur: "oui", libelle: "Oui", points: 5 }
          - { valeur: "non", libelle: "Non", points: 0 }
        alertes:
          - si: "non"
            libelle: "Aucune authentification à deux facteurs sur les comptes sensibles"
            gravite: "rouge"
        actions:
          - si: "non"
            libelle: "Activer la 2FA sur la messagerie et les comptes administrateurs"
            priorite: "URGENT"
            effort: "FAIBLE"

      - id: "D2Q5"
        libelle: "Des services de votre mairie sont-ils accessibles depuis Internet ?"
        aide: "Ex. bureau à distance (RDP), partage de fichiers, caméras. Cochez tout ce qui est exposé publiquement."
        type: "choix_multiple"
        pointsMax: 5
        options:
          - { valeur: "aucun",    libelle: "Aucun / je ne sais pas", points: 5 }
          - { valeur: "rdp",      libelle: "Bureau à distance (RDP)", points: 0 }
          - { valeur: "fichiers", libelle: "Partage de fichiers (SMB)", points: 0 }
          - { valeur: "cameras",  libelle: "Caméras / vidéosurveillance", points: 1 }
          - { valeur: "vpn",      libelle: "VPN (accès sécurisé)", points: 4 }
        alertes:
          - si: ["rdp", "fichiers"]
            libelle: "Service exposé sur Internet sans protection (RDP ou SMB)"
            gravite: "rouge"
        actions:
          - si: ["rdp", "fichiers"]
            libelle: "Fermer les accès directs Internet vers RDP / SMB, passer par un VPN"
            priorite: "URGENT"
            effort: "MOYEN"

      - id: "D2Q6"
        libelle: "Les agents sont-ils sensibilisés au phishing (mails frauduleux) ?"
        aide: "1 = aucune sensibilisation, 4 = formations régulières + tests internes."
        type: "echelle_1_4"
        pointsMax: 3
        options:
          - { valeur: "1", libelle: "Aucune sensibilisation", points: 0 }
          - { valeur: "2", libelle: "Message occasionnel", points: 1 }
          - { valeur: "3", libelle: "Formation ponctuelle", points: 2 }
          - { valeur: "4", libelle: "Formation régulière + tests", points: 3 }
        actions:
          - si: ["1", "2"]
            libelle: "Organiser une sensibilisation phishing pour les agents"
            priorite: "COURT_TERME"
            effort: "FAIBLE"
            ressourceUrl: "https://cybermalveillance.gouv.fr"

  # ---------- D3 — Sauvegarde et continuité ----------
  - id: "D3"
    libelle: "Sauvegarde et continuité"
    poids: 5
    questions:
      - id: "D3Q1"
        libelle: "Vos données sont-elles sauvegardées régulièrement ?"
        aide: "Toute sauvegarde compte : disque externe, NAS, cloud, prestataire."
        type: "oui_non"
        pointsMax: 5
        options:
          - { valeur: "oui", libelle: "Oui", points: 5 }
          - { valeur: "non", libelle: "Non", points: 0 }
        alertes:
          - si: "non"
            libelle: "Aucune sauvegarde des données"
            gravite: "rouge"
        actions:
          - si: "non"
            libelle: "Mettre en place une sauvegarde automatique quotidienne"
            priorite: "URGENT"
            effort: "MOYEN"
            budgetMin: 200
            budgetMax: 1500

      - id: "D3Q2"
        libelle: "À quelle fréquence les sauvegardes sont-elles réalisées ?"
        aide: "Réponse indicative — l'objectif classique est quotidien pour les données actives."
        type: "choix_unique"
        pointsMax: 4
        options:
          - { valeur: "jamais",     libelle: "Jamais", points: 0 }
          - { valeur: "mensuel",    libelle: "Une fois par mois", points: 1 }
          - { valeur: "hebdomadaire", libelle: "Chaque semaine", points: 3 }
          - { valeur: "quotidien",  libelle: "Chaque jour", points: 4 }
        actions:
          - si: ["jamais", "mensuel"]
            libelle: "Passer les sauvegardes à une fréquence au moins hebdomadaire"
            priorite: "URGENT"
            effort: "FAIBLE"

      - id: "D3Q3"
        libelle: "Au moins une copie de sauvegarde est-elle conservée hors des locaux (externalisée) ?"
        aide: "Règle 3-2-1 : 3 copies, 2 supports, 1 hors site. Un cloud ou une location distante compte."
        type: "oui_non"
        pointsMax: 4
        options:
          - { valeur: "oui", libelle: "Oui", points: 4 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Externaliser au moins une copie des sauvegardes (cloud ou site distant)"
            priorite: "COURT_TERME"
            effort: "MOYEN"

      - id: "D3Q4"
        libelle: "Un test de restauration à partir des sauvegardes a-t-il été réalisé dans les 12 derniers mois ?"
        aide: "Ce test consiste à récupérer réellement un fichier depuis la sauvegarde pour vérifier qu'elle fonctionne."
        type: "oui_non"
        pointsMax: 5
        options:
          - { valeur: "oui", libelle: "Oui", points: 5 }
          - { valeur: "non", libelle: "Non", points: 0 }
        alertes:
          - si: "non"
            libelle: "Aucune restauration testée — la sauvegarde n'a pas de valeur prouvée"
            gravite: "rouge"
        actions:
          - si: "non"
            libelle: "Tester la restauration d'un fichier à partir de la sauvegarde"
            priorite: "URGENT"
            effort: "FAIBLE"

      - id: "D3Q5"
        libelle: "Existe-t-il un Plan de Reprise ou de Continuité d'Activité (PRA/PCA) documenté ?"
        aide: "Un document simple décrivant quoi faire en cas d'incident majeur (qui appeler, comment continuer à travailler)."
        type: "oui_non"
        pointsMax: 2
        options:
          - { valeur: "oui", libelle: "Oui", points: 2 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Rédiger un PRA/PCA simple (une page suffit pour commencer)"
            priorite: "MOYEN_TERME"
            effort: "MOYEN"

  # ---------- D4 — Réseau et infrastructure ----------
  - id: "D4"
    libelle: "Réseau et infrastructure"
    poids: 3
    questions:
      - id: "D4Q1"
        libelle: "Existe-t-il un schéma du réseau (routeurs, switchs, points d'accès) ?"
        aide: "Un dessin, même à la main, indiquant qui parle à qui."
        type: "oui_non"
        pointsMax: 2
        options:
          - { valeur: "oui", libelle: "Oui", points: 2 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Établir un schéma simple du réseau"
            priorite: "MOYEN_TERME"
            effort: "FAIBLE"

      - id: "D4Q2"
        libelle: "Le Wi-Fi public (visiteurs) est-il séparé du réseau administratif ?"
        aide: "Deux réseaux distincts, chacun avec son propre nom (SSID) et son propre mot de passe."
        type: "oui_non"
        pointsMax: 5
        options:
          - { valeur: "oui", libelle: "Oui", points: 5 }
          - { valeur: "non", libelle: "Non", points: 0 }
        alertes:
          - si: "non"
            libelle: "Wi-Fi visiteurs non séparé du réseau administratif"
            gravite: "rouge"
        actions:
          - si: "non"
            libelle: "Configurer un SSID invité isolé du réseau administratif"
            priorite: "URGENT"
            effort: "FAIBLE"

      - id: "D4Q3"
        libelle: "Disposez-vous d'un pare-feu (box opérateur, boîtier dédié) correctement configuré ?"
        aide: "1 = aucun ou box par défaut ouverte, 4 = pare-feu dédié avec règles auditées."
        type: "echelle_1_4"
        pointsMax: 3
        options:
          - { valeur: "1", libelle: "Aucun / paramètres par défaut", points: 0 }
          - { valeur: "2", libelle: "Basique", points: 1 }
          - { valeur: "3", libelle: "Correct", points: 2 }
          - { valeur: "4", libelle: "Dédié et audité", points: 3 }
        actions:
          - si: ["1", "2"]
            libelle: "Faire auditer/configurer un pare-feu par un prestataire"
            priorite: "COURT_TERME"
            effort: "MOYEN"

      - id: "D4Q4"
        libelle: "Disposez-vous d'une solution de secours si votre connexion Internet tombe ?"
        aide: "Ex : partage 4G d'un téléphone, seconde ligne, box de secours."
        type: "oui_non"
        pointsMax: 2
        options:
          - { valeur: "oui", libelle: "Oui", points: 2 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Prévoir une solution de secours Internet (4G, seconde ligne)"
            priorite: "MOYEN_TERME"
            effort: "FAIBLE"

  # ---------- D5 — Conformité RGPD et données ----------
  - id: "D5"
    libelle: "Conformité RGPD et données"
    poids: 3
    questions:
      - id: "D5Q1"
        libelle: "Un registre des traitements de données personnelles est-il tenu à jour ?"
        aide: "Registre obligatoire depuis 2018 (RGPD). Modèle simplifié dispo sur cnil.fr."
        type: "oui_non"
        pointsMax: 4
        options:
          - { valeur: "oui", libelle: "Oui", points: 4 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Établir ou mettre à jour le registre des traitements"
            priorite: "COURT_TERME"
            effort: "MOYEN"
            ressourceUrl: "https://www.cnil.fr/fr/RGPD-le-registre-des-activites-de-traitement"

      - id: "D5Q2"
        libelle: "Un Délégué à la Protection des Données (DPO) a-t-il été désigné (interne ou mutualisé) ?"
        aide: "Obligation pour toute collectivité. Peut être mutualisé au niveau de l'intercommunalité."
        type: "oui_non"
        pointsMax: 3
        options:
          - { valeur: "oui", libelle: "Oui", points: 3 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Désigner un DPO (mutualisation possible via l'intercommunalité)"
            priorite: "URGENT"
            effort: "FAIBLE"

      - id: "D5Q3"
        libelle: "Où sont hébergées les données personnelles gérées par vos logiciels métier ?"
        aide: "Vérifiez auprès des éditeurs si vous n'êtes pas sûr."
        type: "choix_unique"
        pointsMax: 4
        options:
          - { valeur: "france",  libelle: "En France", points: 4 }
          - { valeur: "ue",      libelle: "Dans l'Union européenne", points: 3 }
          - { valeur: "hors_ue", libelle: "Hors Union européenne", points: 0 }
          - { valeur: "inconnu", libelle: "Je ne sais pas", points: 0 }
        alertes:
          - si: ["hors_ue"]
            libelle: "Données personnelles hébergées hors Union européenne"
            gravite: "orange"
        actions:
          - si: ["inconnu"]
            libelle: "Identifier la localisation d'hébergement de chaque logiciel métier"
            priorite: "COURT_TERME"
            effort: "FAIBLE"
          - si: ["hors_ue"]
            libelle: "Vérifier les garanties de transfert hors UE, envisager un changement de prestataire"
            priorite: "COURT_TERME"
            effort: "MOYEN"

      - id: "D5Q4"
        libelle: "Existe-t-il une procédure de révocation des accès lors du départ d'un agent ?"
        aide: "Comptes désactivés, badges rendus, mots de passe changés."
        type: "oui_non"
        pointsMax: 4
        options:
          - { valeur: "oui", libelle: "Oui", points: 4 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Formaliser une procédure de départ d'agent (checklist des accès à révoquer)"
            priorite: "COURT_TERME"
            effort: "FAIBLE"

  # ---------- D6 — Gouvernance et organisation ----------
  - id: "D6"
    libelle: "Gouvernance et organisation"
    poids: 2
    questions:
      - id: "D6Q1"
        libelle: "Une personne référente informatique est-elle clairement identifiée dans la collectivité ?"
        aide: "Un agent, un élu, ou un prestataire clairement désigné comme point de contact."
        type: "oui_non"
        pointsMax: 3
        options:
          - { valeur: "oui", libelle: "Oui", points: 3 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Désigner formellement un référent informatique"
            priorite: "COURT_TERME"
            effort: "FAIBLE"

      - id: "D6Q2"
        libelle: "Disposez-vous d'un contrat de maintenance informatique avec un prestataire ?"
        aide: "Un contrat écrit avec engagement de délai d'intervention."
        type: "oui_non"
        pointsMax: 3
        options:
          - { valeur: "oui", libelle: "Oui", points: 3 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Contractualiser la maintenance informatique"
            priorite: "MOYEN_TERME"
            effort: "MOYEN"

      - id: "D6Q3"
        libelle: "Un budget informatique annuel est-il formalisé ?"
        aide: "Ligne dédiée dans le budget, permettant d'anticiper renouvellements et projets."
        type: "oui_non"
        pointsMax: 2
        options:
          - { valeur: "oui", libelle: "Oui", points: 2 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Créer une ligne budgétaire informatique dédiée"
            priorite: "MOYEN_TERME"
            effort: "FAIBLE"

      - id: "D6Q4"
        libelle: "Existe-t-il une documentation à jour des systèmes (mots de passe admin, contrats, licences) ?"
        aide: "Un classeur ou un fichier chiffré accessible aux référents."
        type: "oui_non"
        pointsMax: 2
        options:
          - { valeur: "oui", libelle: "Oui", points: 2 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Rassembler la documentation (contrats, licences, mots de passe admin)"
            priorite: "COURT_TERME"
            effort: "FAIBLE"

  # ---------- D7 — Usages et pratiques des agents ----------
  - id: "D7"
    libelle: "Usages et pratiques des agents"
    poids: 2
    questions:
      - id: "D7Q1"
        libelle: "Les agents ont-ils bénéficié d'une formation à la sécurité informatique dans les 24 derniers mois ?"
        aide: "Formation courte (1h) ou module en ligne comptent."
        type: "oui_non"
        pointsMax: 3
        options:
          - { valeur: "oui", libelle: "Oui", points: 3 }
          - { valeur: "non", libelle: "Non", points: 0 }
        actions:
          - si: "non"
            libelle: "Programmer une formation cybersécurité pour les agents"
            priorite: "COURT_TERME"
            effort: "FAIBLE"
            ressourceUrl: "https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/sensicybermalveillance"

      - id: "D7Q2"
        libelle: "Les agents utilisent-ils des clés USB personnelles sur les postes de la mairie ?"
        aide: "Une pratique très risquée : la clé peut apporter des logiciels malveillants."
        type: "oui_non"
        pointsMax: 3
        options:
          - { valeur: "oui", libelle: "Oui", points: 0 }
          - { valeur: "non", libelle: "Non", points: 3 }
        alertes:
          - si: "oui"
            libelle: "Utilisation de supports amovibles personnels"
            gravite: "orange"
        actions:
          - si: "oui"
            libelle: "Interdire ou encadrer l'usage de clés USB personnelles"
            priorite: "COURT_TERME"
            effort: "FAIBLE"

      - id: "D7Q3"
        libelle: "Des outils numériques non validés par la collectivité sont-ils utilisés par les agents (WhatsApp pro, Dropbox perso, etc.) ?"
        aide: "Ces outils échappent au contrôle et peuvent poser des problèmes RGPD."
        type: "oui_non"
        pointsMax: 2
        options:
          - { valeur: "oui", libelle: "Oui", points: 0 }
          - { valeur: "non", libelle: "Non", points: 2 }
        actions:
          - si: "oui"
            libelle: "Recenser les outils utilisés et proposer des alternatives validées"
            priorite: "COURT_TERME"
            effort: "MOYEN"

      - id: "D7Q4"
        libelle: "Plusieurs agents partagent-ils le même compte utilisateur ou le même mot de passe ?"
        aide: "Chaque agent doit avoir son propre compte pour tracer les actions."
        type: "oui_non"
        pointsMax: 4
        options:
          - { valeur: "oui", libelle: "Oui", points: 0 }
          - { valeur: "non", libelle: "Non", points: 4 }
        alertes:
          - si: "oui"
            libelle: "Comptes ou mots de passe partagés entre agents"
            gravite: "rouge"
        actions:
          - si: "oui"
            libelle: "Créer un compte nominatif par agent"
            priorite: "URGENT"
            effort: "FAIBLE"
```

- [ ] **Step 2: Verify the barème loads and validates**

Add a temporary check by writing a script (do NOT commit it):

```bash
node --experimental-strip-types -e "
import { chargerBareme } from './src/lib/bareme/loader.ts';
const b = chargerBareme('./config/bareme.yaml');
console.log('OK — version', b.version, '—', b.domaines.length, 'domaines,',
  b.domaines.reduce((n, d) => n + d.questions.length, 0), 'questions');
"
```

Expected: `OK — version 2026.1 — 7 domaines, 34 questions`.

If validation fails, read the French error message and fix the YAML.

- [ ] **Step 3: Commit**

```bash
git add config/bareme.yaml
git commit -m "feat(bareme): author v1 barème (7 domaines, 34 questions, FR)"
```

---

## Task 12: Integration test — full engine

**Files:**
- Create: `tests/unit/integration/moteur.test.ts`

- [ ] **Step 1: Write the integration test**

Create `tests/unit/integration/moteur.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import path from "node:path";
import { chargerBareme } from "@/lib/bareme/loader";
import {
  calculerScoreGlobal,
  calculerScoreDomaine,
} from "@/lib/scoring";
import { detecterAlertes } from "@/lib/alertes/detecter";
import { genererActions, trierActions } from "@/lib/actions";
import type { Reponse } from "@/lib/bareme";

const BAREME_PATH = path.join(
  process.cwd(),
  "config",
  "bareme.yaml",
);

describe("moteur — bout en bout avec le barème v1", () => {
  const bareme = chargerBareme(BAREME_PATH);

  it("loads the v1 barème with 7 domaines and 34 questions", () => {
    expect(bareme.version).toBe("2026.1");
    expect(bareme.domaines).toHaveLength(7);
    const total = bareme.domaines.reduce(
      (n, d) => n + d.questions.length,
      0,
    );
    expect(total).toBe(34);
  });

  it("catastrophic answers produce a 'critique' palier and multiple red alerts", () => {
    // Answer 'non' or worst-case to every question that has one.
    const reponses: Reponse[] = [];
    for (const d of bareme.domaines) {
      for (const q of d.questions) {
        // Pick the option with the lowest points, deterministically.
        const worst = [...q.options].sort((a, b) => a.points - b.points)[0];
        const valeur =
          q.type === "choix_multiple" ? [worst.valeur] : worst.valeur;
        reponses.push({ questionId: q.id, valeur });
      }
    }

    const score = calculerScoreGlobal(bareme, reponses);
    expect(score.palier.code).toBe("critique");

    const alertes = detecterAlertes(bareme, reponses);
    expect(alertes.filter((a) => a.gravite === "rouge").length).toBeGreaterThanOrEqual(4);

    const actions = trierActions(genererActions(bareme, reponses));
    // At least the URGENT actions come first.
    expect(actions[0].priorite).toBe("URGENT");
    // No action has effort/priority undefined.
    for (const a of actions) {
      expect(a.priorite).toBeDefined();
      expect(a.effort).toBeDefined();
    }
  });

  it("ideal answers produce a 'solide' palier and no alerts", () => {
    const reponses: Reponse[] = [];
    for (const d of bareme.domaines) {
      for (const q of d.questions) {
        const best = [...q.options].sort((a, b) => b.points - a.points)[0];
        const valeur =
          q.type === "choix_multiple" ? [best.valeur] : best.valeur;
        reponses.push({ questionId: q.id, valeur });
      }
    }
    const score = calculerScoreGlobal(bareme, reponses);
    expect(score.palier.code).toBe("solide");
    expect(detecterAlertes(bareme, reponses)).toHaveLength(0);
  });

  it("scores each domain independently in the parDomaine array", () => {
    const reponses: Reponse[] = [
      // Only answer D3Q1 = "non"
      { questionId: "D3Q1", valeur: "non" },
    ];
    const score = calculerScoreGlobal(bareme, reponses);
    const d3 = score.parDomaine.find((s) => s.domaineId === "D3");
    expect(d3?.nbQuestionsRepondues).toBe(1);
    expect(d3?.pourcentage).toBe(0);
    const d1 = score.parDomaine.find((s) => s.domaineId === "D1");
    expect(d1?.nbQuestionsRepondues).toBe(0);
  });
});
```

- [ ] **Step 2: Update Vitest config to include integration folder**

Verify `vitest.config.ts` still matches `tests/unit/**/*.test.ts` — the new file is under `tests/unit/integration/`, so it is picked up automatically. No config change needed.

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: **all** unit + integration tests pass. If the "catastrophic answers → critique" test fails, that means the worst-case weighted score is > 39 with the current barème — inspect and adjust question weights.

- [ ] **Step 4: Commit**

```bash
git add tests/unit/integration/moteur.test.ts
git commit -m "test(integration): end-to-end engine test against v1 barème"
```

---

## Task 13: Expose engine helpers via a single import surface

**Files:**
- Create: `src/lib/moteur.ts`

- [ ] **Step 1: Write the façade**

Create `src/lib/moteur.ts`:

```ts
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
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
npm test
```

Expected: no TS errors, all tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/moteur.ts
git commit -m "feat(moteur): façade exposing evaluerDiagnostic()"
```

---

## Task 14: Final verification

- [ ] **Step 1: Run the full suite**

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: all pass. `npm run build` succeeds because none of the new modules pull in browser-only APIs.

- [ ] **Step 2: Tag**

```bash
git tag questionnaire-engine-v1
```

---

## Definition of Done — Questionnaire engine

- `config/bareme.yaml` loads and validates (7 domaines, 34 questions, French).
- All unit tests pass: loader (3), question (6), domaine (6), palier (10), global (4), alertes (6), actions/generer (3), actions/trier (3), integration (4). ≥ 45 assertions total.
- `evaluerDiagnostic(reponses)` is importable from `@/lib/moteur` and returns `{ score, alertes, actions }`.
- No UI dependencies — every module is pure and importable from either server components or unit tests.
- Ready to be consumed by Plans 3–5 (questionnaire UI, dashboard, PDF).
