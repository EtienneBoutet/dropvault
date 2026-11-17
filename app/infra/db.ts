import { createPostgresDatabase } from "remix/data-table/postgres";

export const db = createPostgresDatabase({
  uri: process.env.DATABASE_URL,
  multipleStatements: true,
});
