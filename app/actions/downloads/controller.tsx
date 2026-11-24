import { createController } from "remix/router";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";

import { routes } from "../../routes.ts";
import { db } from "../../db/index.ts";
import { files } from "../../db/schema.ts";
import { DownloadPage } from "./download-page.tsx";
import { getDownloadUrl } from "../../infra/s3.ts";

export default createController(routes.files, {
  actions: {
    async show(context) {
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.slug, context.params.slug))
        .limit(1);

      if (!file) {
        return new Response("File not found", {
          status: 404,
        });
      }

      if (file.status === "pending" || file.status === "processing") {
        return context.render(<DownloadPage file={file} state="processing" />);
      }

      if (file.status === "failed") {
        return context.render(<DownloadPage file={file} state="failed" />);
      }

      if (file.status === "expired" || file.expiresAt <= new Date()) {
        return context.render(<DownloadPage file={file} state="expired" />);
      }

      if (
        file.maxDownloads !== null &&
        file.downloadCount >= file.maxDownloads
      ) {
        return context.render(
          <DownloadPage file={file} state="limit-reached" />,
        );
      }

      if (file.passwordHash) {
        return context.render(
          <DownloadPage file={file} state="password-required" />,
        );
      }

      return context.render(<DownloadPage file={file} state="ready" />);
    },

    async download(context) {
      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.slug, context.params.slug))
        .limit(1);

      if (!file) {
        return new Response("File not found", {
          status: 404,
        });
      }

      // Password verification must happen before download authorization.
      if (file.passwordHash) {
        return new Response("Password verification required", {
          status: 403,
        });
      }

      const now = new Date();

      // Atomically authorize and consume one download.
      const [updated] = await db
        .update(files)
        .set({
          downloadCount: sql`${files.downloadCount} + 1`,
        })
        .where(
          and(
            eq(files.id, file.id),
            eq(files.slug, context.params.slug),
            eq(files.status, "ready"),
            gt(files.expiresAt, now),
            or(
              isNull(files.maxDownloads),
              sql`${files.downloadCount} < ${files.maxDownloads}`,
            ),
          ),
        )
        .returning({
          id: files.id,
        });

      if (!updated) {
        return new Response(
          "File expired, unavailable, or download limit reached",
          { status: 410 },
        );
      }

      // Generate the S3 presigned download URL.
      const url = await getDownloadUrl(
        file.id,
        file.originalName,
        file.mimeType,
      );

      return Response.redirect(url, 302);
    },
  },
});
