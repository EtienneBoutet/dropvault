import { type Handle } from "remix/component";
import type { File } from "../../db/schema.ts";
import { Document } from "../document.tsx";
import { DownloadButton } from "../public/download-button.tsx";

type DownloadPageProps = {
  file: File;
  state:
    | "processing"
    | "failed"
    | "expired"
    | "limit-reached"
    | "password-required"
    | "ready";
};

export function DownloadPage(handle: Handle<DownloadPageProps>) {
  return () => {
    const { file, state } = handle.props;

    return (
      <Document>
        <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
            <div className="text-5xl mb-5">
              {state === "ready" ? "📄" : "⚠️"}
            </div>

            <h1 className="text-xl font-semibold break-words">
              {file.originalName}
            </h1>

            {state === "processing" && (
              <p className="mt-3 text-neutral-500">
                Your file is being processed. Please check back shortly.
              </p>
            )}

            {state === "failed" && (
              <p className="mt-3 text-red-600">
                This file could not be processed.
              </p>
            )}

            {state === "expired" && (
              <p className="mt-3 text-neutral-500">
                This shared link has expired.
              </p>
            )}

            {state === "limit-reached" && (
              <p className="mt-3 text-neutral-500">
                This file has reached its download limit.
              </p>
            )}

            {state === "password-required" && (
              <p className="mt-3 text-neutral-500">
                This file is password protected.
              </p>
            )}

            {state === "ready" && (
              <>
                <p className="mt-3 text-sm text-neutral-500">
                  Someone shared this file with you.
                </p>
                <DownloadButton slug={file.slug} />
              </>
            )}

            <p className="mt-5 text-xs text-neutral-400">
              Shared securely with DropVault
            </p>
          </div>
        </main>
      </Document>
    );
  };
}
