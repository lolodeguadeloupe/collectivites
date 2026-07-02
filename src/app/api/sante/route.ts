import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  let baseDeDonnees = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    baseDeDonnees = true;
  } catch {
    baseDeDonnees = false;
  }
  return NextResponse.json({ statut: "ok", baseDeDonnees });
}
