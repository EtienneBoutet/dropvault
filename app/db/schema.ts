import {
  bigint,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const fileStatusEnum = pgEnum("file_status", [
  "pending",
  "processing",
  "ready",
  "failed",
  "expired",
]);

export const files = pgTable("files", {
  id: uuid("id").primaryKey(),
  slug: varchar("slug", { length: 12 }).notNull().unique(),
  originalName: text("original_name").notNull(),
  passwordHash: text("password_hash"), // Nullable since password protection is optional
  mimeType: text("mime_type").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  status: fileStatusEnum("status").default("pending").notNull(),
  maxDownloads: integer("max_downloads"), // Nullable: null = unlimited downloads
  downloadCount: integer("download_count").default(0).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
