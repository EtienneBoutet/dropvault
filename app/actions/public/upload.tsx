import { clientEntry, on, type Handle } from "remix/component";
import { routes } from "../../routes.ts";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB (REQ-01)

export const Upload = clientEntry(
  import.meta.url,
  function Upload(handle: Handle) {
    let shareUrl: string | null = null;
    let error: string | null = null;
    let isUploading = false;

    async function upload(form: HTMLFormElement) {
      const formData = new FormData(form);
      const file = formData.get("file");

      if (!(file instanceof File) || !file.size) return;

      if (file.size > MAX_FILE_SIZE) {
        error = "File exceeds the 100 MB limit.";
        handle.update();
        return;
      }

      const expiresIn = Number(formData.get("expiresIn")) || 86400; // default 24h in seconds
      const rawMaxDownloads = formData.get("maxDownloads")?.toString().trim();
      const maxDownloads = rawMaxDownloads ? Number(rawMaxDownloads) : null;
      const rawPassword = formData.get("password")?.toString();
      const password = rawPassword ? rawPassword : null;

      isUploading = true;
      error = null;
      shareUrl = null;
      handle.update();

      try {
        const presign = await fetch(routes.presign.href(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
          }),
        });
        if (!presign.ok) throw new Error(`Presign failed (${presign.status})`);

        const { uploadUrl, key } = await presign.json();

        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!put.ok) throw new Error(`S3 upload failed (${put.status})`);

        const confirm = await fetch(routes.confirm.href(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            expiresIn,
            maxDownloads,
            password,
          }),
        });

        if (!confirm.ok) throw new Error(`Confirm failed (${confirm.status})`);

        form.reset();
      } catch (e) {
        error = e instanceof Error ? e.message : "Upload failed";
      } finally {
        isUploading = false;
        handle.update();
      }
    }

    return () => (
      <div>
        <form
          mix={[
            on("submit", (event) => {
              event.preventDefault();
              void upload(event.currentTarget);
            }),
          ]}
        >
          <div>
            <label htmlFor="file">File (max 100 MB)</label>
            <input
              id="file"
              type="file"
              name="file"
              accept="image/*,application/pdf,audio/*"
              required
            />
          </div>

          <div>
            <label htmlFor="expiresIn">Expires After</label>
            <select id="expiresIn" name="expiresIn" defaultValue="86400">
              <option value="3600">1 Hour</option>
              <option value="86400">24 Hours</option>
              <option value="604800">7 Days</option>
            </select>
          </div>

          <div>
            <label htmlFor="maxDownloads">Max Downloads (optional)</label>
            <input
              id="maxDownloads"
              type="number"
              name="maxDownloads"
              min="1"
              placeholder="Unlimited"
            />
          </div>

          <div>
            <label htmlFor="password">Password Protection (optional)</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Leave blank for public link"
            />
          </div>

          <button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Create Share Link"}
          </button>
        </form>

        {error && <p role="alert">{error}</p>}

        {shareUrl && (
          <div>
            <p>Upload complete! Share this link:</p>
            <input type="text" readOnly value={shareUrl} />
            <a href={shareUrl}>Open Share Page</a>
          </div>
        )}
      </div>
    );
  },
);
