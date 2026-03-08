import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Mockstorm/);
  await expect(page.getByText("Mockstorm")).toBeVisible();
});
