import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { creerUtilisateur } from "@/lib/inscription";
import { verifyPassword } from "@/lib/password";

describe("creerUtilisateur", () => {
  beforeEach(async () => {
    await prisma.utilisateur.deleteMany({
      where: { email: { endsWith: "@test.diagit.local" } },
    });
  });

  it("creates a user with a bcrypt-hashed password", async () => {
    const user = await creerUtilisateur({
      email: "nadia@test.diagit.local",
      motDePasse: "MotDePasse-Solide-123",
    });

    expect(user.id).toBeTypeOf("string");
    expect(user.email).toBe("nadia@test.diagit.local");
    expect(user.motDePasseHache).not.toBe("MotDePasse-Solide-123");
    await expect(
      verifyPassword("MotDePasse-Solide-123", user.motDePasseHache),
    ).resolves.toBe(true);
  });

  it("lowercases the stored email", async () => {
    const user = await creerUtilisateur({
      email: "NADIA@test.diagit.local",
      motDePasse: "MotDePasse-Solide-123",
    });
    expect(user.email).toBe("nadia@test.diagit.local");
  });

  it("rejects a duplicate email with EmailDejaUtilise", async () => {
    await creerUtilisateur({
      email: "nadia@test.diagit.local",
      motDePasse: "MotDePasse-Solide-123",
    });
    await expect(
      creerUtilisateur({
        email: "nadia@test.diagit.local",
        motDePasse: "AutreMotDePasse-456",
      }),
    ).rejects.toThrow("EmailDejaUtilise");
  });
});
