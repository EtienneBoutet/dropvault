import { expect, test } from "@playwright/test";

// Minimal valid 1x1 transparent PNG so the browser actually decodes and renders the <img>
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("Image Upload Flow", () => {
  test("presigns, uploads to S3, and renders the uploaded preview", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Verify initial page state
    await expect(page.getByText("Something")).toBeVisible();
    const fileInput = page.locator('input[type="file"][name="image"]');
    const uploadButton = page.getByRole("button", { name: "Upload" });

    await expect(fileInput).toBeAttached();
    await expect(uploadButton).toBeVisible();

    // 2. Attach an in-memory PNG file (no external fixture file required)
    await fileInput.setInputFiles({
      name: "e2e-test-image.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });

    // 3. Watch the two network requests triggered on submit:
    //    (a) POST to your presign endpoint
    //    (b) PUT directly to the presigned S3 URL on localhost:3900
    const presignResponsePromise = page.waitForResponse(
      (res) => res.request().method() === "POST" && res.status() === 200,
    );
    const s3PutResponsePromise = page.waitForResponse(
      (res) =>
        res.url().startsWith("http://localhost:3900") &&
        res.request().method() === "PUT",
    );

    await uploadButton.click();

    // 4. Assert the presign endpoint returned valid S3 URLs
    const presignResponse = await presignResponsePromise;
    const { uploadUrl, shareUrl } = await presignResponse.json();
    expect(uploadUrl).toContain("http://localhost:3900");
    expect(shareUrl).toContain("e2e-test-image.png");

    // 5. Assert S3 accepted the binary upload
    const s3PutResponse = await s3PutResponsePromise;
    expect(s3PutResponse.ok()).toBeTruthy();

    // 6. Assert UI updated and the image actually loaded from S3
    await expect(page.getByText("Upload complete!")).toBeVisible();

    const previewImg = page.getByRole("img", { name: "Uploaded preview" });
    await expect(previewImg).toBeVisible();
    await expect(previewImg).toHaveAttribute("src", shareUrl);

    // Confirm the browser decoded the image (naturalWidth > 0) despite attachment disposition
    await expect
      .poll(async () =>
        previewImg.evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0);
  });

  test("prevents submission when no file is selected", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"][name="image"]');
    await page.getByRole("button", { name: "Upload" }).click();

    // Native HTML5 `required` validation blocks form submission
    const isMissingFile = await fileInput.evaluate(
      (input: HTMLInputElement) => input.validity.valueMissing,
    );
    expect(isMissingFile).toBe(true);
    await expect(page.getByText("Upload complete!")).toHaveCount(0);
  });
});
