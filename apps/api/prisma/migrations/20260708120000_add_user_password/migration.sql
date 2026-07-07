-- AlterTable: password login (nullable — legacy users stay on magic-link)
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
