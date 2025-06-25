/*
  Warnings:

  - Added the required column `doctor_id` to the `NOTES` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patient_id` to the `NOTES` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NOTES" ADD COLUMN     "doctor_id" INTEGER NOT NULL,
ADD COLUMN     "patient_id" INTEGER NOT NULL,
ALTER COLUMN "service_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "NOTES" ADD CONSTRAINT "NOTES_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "DOCTOR"("doctor_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NOTES" ADD CONSTRAINT "NOTES_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "PATIENT"("patient_id") ON DELETE CASCADE ON UPDATE NO ACTION;
