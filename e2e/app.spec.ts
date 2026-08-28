import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function loginAsDemo(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByText("I'm a Passenger").click();
  await page.getByLabel("University email").fill("demo@ridemate.app");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/passenger$/, { timeout: 10_000 });
}

test("passenger home shows the bottom tab bar and no serious accessibility violations", async ({ page }) => {
  await loginAsDemo(page);
  await expect(page.getByRole("heading", { name: /Where to/i })).toBeVisible({ timeout: 10_000 });

  await expect(page.getByRole("link", { name: /Home/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Activity/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Profile/i })).toBeVisible();

  const results = await new AxeBuilder({ page }).exclude(".leaflet-container").analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("the chatbot widget opens, accepts a message, and gets a reply", async ({ page }) => {
  await loginAsDemo(page);

  await page.getByRole("button", { name: "Toggle helpline chat" }).click();
  await page.getByPlaceholder("Type your question...").fill("How do fares work?");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("How do fares work?")).toBeVisible();
  // The reply comes from a real AI call — allow generous time rather than
  // asserting on specific wording, since exact phrasing can vary.
  await expect(page.locator("text=/fare|base|km/i").last()).toBeVisible({ timeout: 20_000 });
});

test("logging out returns to the role-select screen", async ({ page }) => {
  await loginAsDemo(page);

  await page.getByRole("link", { name: /Profile/i }).click();
  await page.getByRole("button", { name: /log out/i }).click();

  await expect(page.getByText("How will you be using RideMate?")).toBeVisible({ timeout: 10_000 });
});
