-- CreateTable
CREATE TABLE "SERVICE_REQUEST" (
    "request_id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "service_type_id" INTEGER NOT NULL,
    "preferred_doctor_id" INTEGER,
    "preferred_date_1" TIMESTAMP(3) NOT NULL,
    "preferred_date_2" TIMESTAMP(3),
    "preferred_date_3" TIMESTAMP(3),
    "preferred_time" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "additional_notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SERVICE_REQUEST_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "SERVICE_TYPE" (
    "service_type_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SERVICE_TYPE_pkey" PRIMARY KEY ("service_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SERVICE_TYPE_name_key" ON "SERVICE_TYPE"("name");

-- AddForeignKey
ALTER TABLE "SERVICE_REQUEST" ADD CONSTRAINT "SERVICE_REQUEST_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "PATIENT"("patient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICE_REQUEST" ADD CONSTRAINT "SERVICE_REQUEST_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "SERVICE_TYPE"("service_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SERVICE_REQUEST" ADD CONSTRAINT "SERVICE_REQUEST_preferred_doctor_id_fkey" FOREIGN KEY ("preferred_doctor_id") REFERENCES "DOCTOR"("doctor_id") ON DELETE SET NULL ON UPDATE CASCADE;
