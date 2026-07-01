import { z } from "zod";

export const inscriptionSchema = z.object({
  email: z
    .string()
    .email("Adresse e-mail invalide")
    .max(200, "Adresse e-mail trop longue"),
  motDePasse: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .max(200, "Mot de passe trop long"),
});

export type InscriptionInput = z.infer<typeof inscriptionSchema>;

export const connexionSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});

export type ConnexionInput = z.infer<typeof connexionSchema>;
