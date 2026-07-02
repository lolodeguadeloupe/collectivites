import { NextResponse } from "next/server";
import { inscriptionSchema } from "@/lib/validators";
import { creerUtilisateur, EmailDejaUtilise } from "@/lib/inscription";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = inscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erreur: "Requête invalide", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const utilisateur = await creerUtilisateur(parsed.data);
    return NextResponse.json({ id: utilisateur.id }, { status: 201 });
  } catch (e) {
    if (e instanceof EmailDejaUtilise) {
      return NextResponse.json(
        { erreur: "Cette adresse e-mail est déjà utilisée." },
        { status: 409 },
      );
    }
    throw e;
  }
}
