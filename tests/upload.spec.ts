import { expect, test } from "@playwright/test";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("File Upload Flow", () => {
  test("presigns, uploads to S3, confirms, and renders the share link", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Verify initial page state
    await expect(page.getByText("Something")).toBeVisible();

    const fileInput = page.locator('input[type="file"][name="file"]');
    const uploadButton = page.getByRole("button", {
      name: "Create Share Link",
    });

    await expect(fileInput).toBeAttached();
    await expect(uploadButton).toBeVisible();

    // 2. Attach an in-memory PNG
    await fileInput.setInputFiles({
      name: "e2e-test-image.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });

    // 3. Monitor presign request
    const presignPromise = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" && res.url().includes("/presign"),
    );

    await uploadButton.click();

    const presignResponse = await presignPromise;
    expect(presignResponse.ok()).toBeTruthy();

    const { uploadUrl, key } = await presignResponse.json();

    expect(uploadUrl).toContain("http://localhost:3900");
    expect(key).toBeTruthy();

    // 4. Monitor S3 upload
    const s3PutPromise = page.waitForResponse(
      (res) =>
        res.url().startsWith("http://localhost:3900") &&
        res.request().method() === "PUT",
    );

    const s3Response = await s3PutPromise;
    expect(s3Response.ok()).toBeTruthy();

    // 5. Monitor confirmation request
    const confirmPromise = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" && res.url().includes("/confirm"),
    );

    const confirmResponse = await confirmPromise;
    expect(confirmResponse.ok()).toBeTruthy();
  });

  test("prevents submission when no file is selected", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"][name="file"]');

    await page
      .getByRole("button", {
        name: "Create Share Link",
      })
      .click();

    const isMissingFile = await fileInput.evaluate(
      (input: HTMLInputElement) => input.validity.valueMissing,
    );

    expect(isMissingFile).toBe(true);

    await expect(page.getByText("Upload complete!")).toHaveCount(0);
  });
});
