import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("role select screen has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("How will you be using RideMate?")).toBeVisible();

  const results = await new AxeBuilder({ page }).exclude(".leaflet-container").analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("a passenger can log in with an existing account and reach their home screen", async ({ page }) => {
  await page.goto("/");

  await page.getByText("I'm a Passenger").click();
  await page.getByLabel("University email").fill("demo@ridemate.app");
  await page.getByLabel("Password").fill("demo1234");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText(/Where to, Demo/i)).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/passenger$/);
});

test("logging in with the wrong password shows an inline error, not a crash", async ({ page }) => {
  await page.goto("/");

  await page.getByText("I'm a Passenger").click();
  await page.getByLabel("University email").fill("demo@ridemate.app");
  await page.getByLabel("Password").fill("clearly-wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10_000 });
});

test("signup shows a vehicle-details step for drivers before requesting a code", async ({ page }) => {
  await page.goto("/");

  await page.getByText("I offer rides").click();
  await page.getByText("Create an account").click();

  await page.getByLabel("Full name").fill("Playwright Driver");
  await page.getByLabel("University email").fill(`playwright-driver-${Date.now()}@northsouth.edu`);
  await page.getByLabel("Password").fill("testpass123");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Your vehicle")).toBeVisible();
  await expect(page.getByLabel("Make")).toBeVisible();
});

test("signup rejects a non-university email domain", async ({ page }) => {
  await page.goto("/");

  await page.getByText("I'm a Passenger").click();
  await page.getByText("Create an account").click();

  await page.getByLabel("Full name").fill("Playwright Gmail User");
  await page.getByLabel("University email").fill(`playwright-gmail-${Date.now()}@gmail.com`);
  await page.getByLabel("Password").fill("testpass123");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page.getByText(/please sign up with a valid university email/i)).toBeVisible({ timeout: 10_000 });
});
