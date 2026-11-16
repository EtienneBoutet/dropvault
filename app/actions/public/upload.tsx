import { clientEntry, on, type Handle } from "remix/component";
import { routes } from "../../routes.ts";

export const Upload = clientEntry(
  import.meta.url,
  function Upload(handle: Handle) {
    let imageUrl: string | null = null;
    let error: string | null = null;

    async function upload(form: HTMLFormElement) {
      const file = new FormData(form).get("image");
      if (!(file instanceof File) || !file.size) return;

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

        const { uploadUrl, shareUrl } = await presign.json();

        const put = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) throw new Error(`Upload failed (${put.status})`);

        imageUrl = shareUrl;
        error = null;
      } catch (e) {
        error = e instanceof Error ? e.message : "Upload failed";
      }

      handle.update();
    }

    return () => (
      <div>
        <form
          mix={[
            on("submit", (event) => {
              event.preventDefault(); // synchronous, before any await
              void upload(event.currentTarget);
            }),
          ]}
        >
          <input
            type="file"
            name="image"
            accept="image/png, image/jpeg"
            required
          />
          <button type="submit">Upload</button>
        </form>

        {error && <p role="alert">{error}</p>}

        {imageUrl && (
          <div>
            <p>Upload complete!</p>
            <img
              src={imageUrl}
              alt="Uploaded preview"
              style={{ maxWidth: 300 }}
            />
          </div>
        )}
      </div>
    );
  },
);
