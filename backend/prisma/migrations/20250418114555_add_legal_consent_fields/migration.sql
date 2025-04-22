-- AlterTable
ALTER TABLE "PATIENT" ADD COLUMN     "gdpr_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gdpr_accepted_date" TIMESTAMP(3),
ADD COLUMN     "tos_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tos_accepted_date" TIMESTAMP(3);
