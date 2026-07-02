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
