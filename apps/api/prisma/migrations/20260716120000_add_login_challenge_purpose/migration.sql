-- CreateEnum
CREATE TYPE "LoginChallengePurpose" AS ENUM ('login', 'password_reset');

-- AlterTable: scope one-time tokens by purpose so a login token can't be spent
-- on a password reset (or vice-versa). Existing rows keep the login behavior.
ALTER TABLE "login_challenges" ADD COLUMN "purpose" "LoginChallengePurpose" NOT NULL DEFAULT 'login';
