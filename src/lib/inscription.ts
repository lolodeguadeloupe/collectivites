import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { InscriptionInput } from "@/lib/validators";

export class EmailDejaUtilise extends Error {
  constructor() {
    super("EmailDejaUtilise");
    this.name = "EmailDejaUtilise";
  }
}

export async function creerUtilisateur(input: InscriptionInput) {
  const email = input.email.trim().toLowerCase();
  const existant = await prisma.utilisateur.findUnique({ where: { email } });
  if (existant) throw new EmailDejaUtilise();

  const motDePasseHache = await hashPassword(input.motDePasse);
  return prisma.utilisateur.create({
    data: { email, motDePasseHache },
  });
}
