import { createController } from "remix/router";

import { assets } from "../assets.ts";
import { routes } from "../routes.ts";
import { HomePage } from "./home-page.tsx";
import { createUrls } from "../utils/s3.ts";

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
      const urls = await createUrls(fileName, contentType);
      return Response.json(urls);
    },
  },
});
