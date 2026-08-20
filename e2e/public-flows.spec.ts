import { expect, test } from "@playwright/test";

test("searches the catalogue and opens a detailed stamp record", async ({ page }) => {
  await page.goto("/explore");
  await page.getByPlaceholder("Search by name, country, year...").fill("flag");
  await expect(page.getByRole("heading", { name: "Flag Over Capitol" })).toBeVisible();
  await page.getByRole("link", { name: /Flag Over Capitol/ }).click();
  await expect(page.getByRole("heading", { name: "Flag Over Capitol" })).toBeVisible();
  await expect(page.getByText("Value evidence citations")).toBeVisible();
});

test("runs the mock image-identification result flow", async ({ page }) => {
  await page.goto("/identify");
  await page.locator('input[type="file"]').setInputFiles({
    name: "stamp-demo.png",
    mimeType: "image/png",
    buffer: Buffer.from("mock-image"),
  });
  await page.getByRole("button", { name: "Find closest match" }).click();
  await expect(page.getByText("Closest visual match")).toBeVisible();
  await expect(page.getByText("92%")).toBeVisible();
});

test("renders both public profile and selected album galleries", async ({ page }) => {
  await page.goto("/collections/elena");
  await expect(page.getByRole("heading", { name: "Elena's collection" })).toBeVisible();
  await expect(page.getByText("8 stamps")).toBeVisible();
  await page.getByRole("link", { name: "Modern icons" }).click();
  await expect(page.getByRole("heading", { name: "Modern icons" })).toBeVisible();
  await expect(page.getByText("4 stamps")).toBeVisible();
});
