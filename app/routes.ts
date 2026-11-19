import { get, post, route } from "remix/routes";

export const routes = route({
  assets: get("/assets/*path"),
  home: "/",
  presign: post("api/presign"),
  confirm: post("api/confirm"),
});
