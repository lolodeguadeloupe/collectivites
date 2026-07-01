import { test, expect } from "@playwright/test";

test("landing page shows French title and CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "DiagIT Collectivité" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Se connecter" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Créer un compte" }),
  ).toBeVisible();
});
