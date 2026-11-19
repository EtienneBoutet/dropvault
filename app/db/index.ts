import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

// Prevent multiple connections during hot-reloading in development
declare global {
  var __db: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL_LOCAL!;

const queryClient = global.__db ?? postgres(connectionString);
if (process.env.NODE_ENV !== "production") {
  global.__db = queryClient;
}

export const db = drizzle(queryClient, { schema });
