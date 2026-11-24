import { clientEntry, on, type Handle } from "remix/component";
import { routes } from "../../routes.ts";

type DownloadButtonProps = {
  slug: string;
};

export const DownloadButton = clientEntry(
  import.meta.url,
  function DownloadButton(handle: Handle<DownloadButtonProps>) {
    return () => (
      <button
        type="button"
        mix={on("click", () => {
          console.log("test");
          window.location.assign(
            routes.files.download.href({ slug: handle.props.slug }),
          );
        })}
        className="mt-8 w-full rounded-xl bg-black px-5 py-3 text-white font-medium hover:bg-neutral-800"
      >
        Download file
      </button>
    );
  },
);
