/*
  Warnings:

  - The `questionsJson` column on the `TEST_TEMPLATE_VERSION` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "TEST_TEMPLATE_VERSION" DROP COLUMN "questionsJson",
ADD COLUMN     "questionsJson" JSONB;
