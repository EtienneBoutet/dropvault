ALTER TYPE "public"."file_status" ADD VALUE 'expired';--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "slug" varchar(12) NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "max_downloads" integer;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "download_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_slug_unique" UNIQUE("slug");