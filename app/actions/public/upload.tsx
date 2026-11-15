import { clientEntry, on, type Handle } from "remix/component";
import { routes } from "../../routes.ts";

export const Upload = clientEntry(
  import.meta.url,
  function Upload(handle: Handle) {
    let imageUrl: string | null = null

    const handleSubmit = async (event: SubmitEvent) => {
      event.preventDefault()

      const form = event.currentTarget as HTMLFormElement
      const formData = new FormData(form)
      const file = formData.get('image') as File

      const res = await fetch(routes.presign.href(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        })
      })

      const { uploadUrl, shareUrl } = await res.json()

      console.log({ uploadUrl, shareUrl })

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      imageUrl = shareUrl
      handle.update()
    }

    return () => {
      return (
        <div>
          <form mix={on('submit', handleSubmit)}>
            <input
              type="file"
              name="image"
              accept="image/png, image/jpeg"
              required
            />
            <button type="submit">
              Upload
            </button>
          </form>
          {imageUrl && (
            <div>
              <p>Upload complete!</p>
              <img src={imageUrl} alt="Uploaded preview" style={{ maxWidth: 300 }} />
            </div>
          )}
        </div>
      )
    }
  },
)
