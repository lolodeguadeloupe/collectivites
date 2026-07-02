import { Pool } from "pg";

/**
 * Vide les utilisateurs de test E2E (emails @e2e.diagit.local).
 *
 * Note : on utilise `pg` directement plutôt que le `PrismaClient` généré dans
 * `src/generated/prisma/client.ts`, car ce dernier contient `import.meta.url`
 * et ne peut pas être chargé par le transformateur CommonJS de Playwright tant
 * que le projet n'est pas marqué `"type": "module"` (ce qui casserait Next.js).
 * Le singleton `@/lib/db` ne convient pas non plus (connexion persistante,
 * contexte Node hors Next).
 */
export async function resetTestUsers() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(
      'DELETE FROM "Utilisateur" WHERE email LIKE $1',
      ["%@e2e.diagit.local"],
    );
  } finally {
    await pool.end();
  }
}
