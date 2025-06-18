/*
  Warnings:

  - Added the required column `target_type` to the `FEEDBACK` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "feedback_target_type" AS ENUM ('DOCTOR', 'SERVICE');

-- AlterTable
ALTER TABLE "FEEDBACK" ADD COLUMN     "target_type" "feedback_target_type" NOT NULL;

-- AlterTable
ALTER TABLE "TEST_TEMPLATE_VERSION" ALTER COLUMN "questionsJson" SET DATA TYPE JSON;
