import { createController } from "remix/router";

import { assets } from "../assets.ts";
import { routes } from "../routes.ts";
import { HomePage } from "./home-page.tsx";
import { createSignedUrl } from "../infra/s3.ts";

import crypto from "node:crypto";
import { db } from "../db/index.ts";
import { files } from "../db/schema.ts";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateSlug(length = 12): string {
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return slug;
}

export default createController(routes, {
  actions: {
    async assets(context) {
      return (
        (await assets.fetch(context.request)) ??
        new Response("Not Found", { status: 404 })
      );
    },
    home(context) {
      return context.render(<HomePage />);
    },
    async presign({ request }) {
      const { fileName, contentType } = await request.json();
      const urls = await createSignedUrl(fileName, contentType);
      return Response.json(urls);
    },
    async confirm({ request }) {
      const {
        key,
        fileName,
        contentType,
        sizeBytes,
        expiresIn,
        maxDownloads,
        password,
      } = await request.json();

      const slug = generateSlug(12);
      const expiresAt = new Date(Date.now() + Number(expiresIn) * 1000);

      const [inserted] = await db
        .insert(files)
        .values({
          id: key,
          slug,
          originalName: fileName,
          mimeType: contentType,
          sizeBytes: sizeBytes,
          status: "processing",
          passwordHash: password,
          maxDownloads: maxDownloads ? Number(maxDownloads) : null,
          expiresAt,
        })
        .returning({ id: files.id, slug: files.slug });

      return Response.json({ inserted });
    },
  },
});
