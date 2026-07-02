import { test, expect } from "@playwright/test";
import { resetTestUsers } from "./utils/reset";

test.beforeEach(async () => {
  await resetTestUsers();
});

test("signup then login lands on the dashboard", async ({ page }) => {
  const email = `nadia+${Date.now()}@e2e.diagit.local`;
  const motDePasse = "MotDePasse-Solide-123";

  await page.goto("/inscription");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel(/Mot de passe/).fill(motDePasse);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL(/\/connexion\?inscription=ok/);

  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/tableau-de-bord/);
  await expect(
    page.getByRole("heading", { name: "Tableau de bord" }),
  ).toBeVisible();
});

test("visiting the dashboard while logged out redirects to login", async ({
  page,
}) => {
  await page.goto("/tableau-de-bord");
  await expect(page).toHaveURL(/\/connexion/);
});
