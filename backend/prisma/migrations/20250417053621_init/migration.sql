-- CreateEnum
CREATE TYPE "genders_enum" AS ENUM ('male', 'female', 'unspecified');

-- CreateEnum
CREATE TYPE "service_types_enum" AS ENUM ('Consultation', 'Group Consultation');

-- CreateTable
CREATE TABLE "DOCTOR" (
    "doctor_id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "specialization" VARCHAR(255),
    "bio" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DOCTOR_pkey" PRIMARY KEY ("doctor_id")
);

-- CreateTable
CREATE TABLE "EMPLOYEE" (
    "employee_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "job_title" VARCHAR(100) NOT NULL,
    "hire_date" DATE NOT NULL,
    "termination_date" DATE,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EMPLOYEE_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "FEEDBACK" (
    "feedback_id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "participant_id" INTEGER NOT NULL,
    "rating_score" INTEGER,
    "comments" TEXT,
    "submission_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FEEDBACK_pkey" PRIMARY KEY ("feedback_id")
);

-- CreateTable
CREATE TABLE "NOTES" (
    "note_id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "participant_id" INTEGER,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NOTES_pkey" PRIMARY KEY ("note_id")
);

-- CreateTable
CREATE TABLE "NOTICES" (
    "notice_id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "participant_id" INTEGER NOT NULL,
    "issue_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unique_notice_number" VARCHAR(50),
    "expiry_date" DATE,
    "reason_for_issuance" TEXT,
    "fitness_status" VARCHAR(50),
    "recommendations" TEXT,
    "attachment_path" VARCHAR(512),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NOTICES_pkey" PRIMARY KEY ("notice_id")
);

-- CreateTable
CREATE TABLE "PATIENT" (
    "patient_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "emergency_contact_name" VARCHAR(200),
    "emergency_contact_phone" VARCHAR(20),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PATIENT_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "PATIENT_FORM" (
    "form_id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "submission_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "form_data" JSON NOT NULL,
    "status" VARCHAR(50) DEFAULT 'Submitted',

    CONSTRAINT "PATIENT_FORM_pkey" PRIMARY KEY ("form_id")
);

-- CreateTable
CREATE TABLE "PERMISSION" (
    "permission_id" SERIAL NOT NULL,
    "permission_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "PERMISSION_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "ROLE" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "ROLE_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "ROLE_PERMISSIONS" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ROLE_PERMISSIONS_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "SERVICE" (
    "service_id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "service_type" "service_types_enum" NOT NULL DEFAULT 'Consultation',
    "start_time" TIMESTAMP(6) NOT NULL,
    "end_time" TIMESTAMP(6) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    "cancel_reason" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SERVICE_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "SERVICE_PARTICIPANT" (
    "participant_id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "attendance_status" VARCHAR(50) DEFAULT 'Expected',
    "added_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SERVICE_PARTICIPANT_pkey" PRIMARY KEY ("participant_id")
);

-- CreateTable
CREATE TABLE "TEST_INSTANCE" (
    "test_instance_id" SERIAL NOT NULL,
    "patient_id" INTEGER,
    "test_template_version_ID" INTEGER,
    "testStartDate" TIMESTAMP(6),
    "testStopDate" TIMESTAMP(6),
    "patientResponse" JSONB,

    CONSTRAINT "TEST_INSTANCE_pkey" PRIMARY KEY ("test_instance_id")
);

-- CreateTable
CREATE TABLE "TEST_TEMPLATE" (
    "test_template_id" SERIAL NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN,
    "template_questions" JSONB,
    "isExternal" BOOLEAN,

    CONSTRAINT "TEST_TEMPLATE_pkey" PRIMARY KEY ("test_template_id")
);

-- CreateTable
CREATE TABLE "TEST_TEMPLATE_VERSION" (
    "test_template_version_ID" SERIAL NOT NULL,
    "test_template_id" INTEGER,
    "version" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionsJson" TEXT,

    CONSTRAINT "TEST_TEMPLATE_VERSION_pkey" PRIMARY KEY ("test_template_version_ID")
);

-- CreateTable
CREATE TABLE "USER" (
    "user_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" "genders_enum" NOT NULL DEFAULT 'unspecified',
    "phone_number" VARCHAR(20),
    "address_street" VARCHAR(255),
    "address_city" VARCHAR(100),
    "address_postal_code" VARCHAR(20),
    "address_country" VARCHAR(100),
    "address_county" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(6),

    CONSTRAINT "USER_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "USER_ROLES" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "USER_ROLES_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DOCTOR_employee_id_key" ON "DOCTOR"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "EMPLOYEE_user_id_key" ON "EMPLOYEE"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "NOTICES_unique_notice_number_key" ON "NOTICES"("unique_notice_number");

-- CreateIndex
CREATE UNIQUE INDEX "PATIENT_user_id_key" ON "PATIENT"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PERMISSION_permission_name_key" ON "PERMISSION"("permission_name");

-- CreateIndex
CREATE UNIQUE INDEX "ROLE_role_name_key" ON "ROLE"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "SERVICE_PARTICIPANT_service_id_patient_id_idx" ON "SERVICE_PARTICIPANT"("service_id", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "USER_email_key" ON "USER"("email");

-- CreateIndex
CREATE UNIQUE INDEX "USER_phone_number_key" ON "USER"("phone_number");

-- AddForeignKey
ALTER TABLE "DOCTOR" ADD CONSTRAINT "DOCTOR_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "EMPLOYEE"("employee_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EMPLOYEE" ADD CONSTRAINT "EMPLOYEE_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FEEDBACK" ADD CONSTRAINT "FEEDBACK_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "SERVICE_PARTICIPANT"("participant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FEEDBACK" ADD CONSTRAINT "FEEDBACK_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "SERVICE"("service_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NOTES" ADD CONSTRAINT "NOTES_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "SERVICE_PARTICIPANT"("participant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NOTES" ADD CONSTRAINT "NOTES_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "SERVICE"("service_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NOTICES" ADD CONSTRAINT "NOTICES_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "SERVICE_PARTICIPANT"("participant_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NOTICES" ADD CONSTRAINT "NOTICES_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "SERVICE"("service_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PATIENT" ADD CONSTRAINT "PATIENT_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PATIENT_FORM" ADD CONSTRAINT "PATIENT_FORM_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "PATIENT"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ROLE_PERMISSIONS" ADD CONSTRAINT "ROLE_PERMISSIONS_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "PERMISSION"("permission_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ROLE_PERMISSIONS" ADD CONSTRAINT "ROLE_PERMISSIONS_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ROLE"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SERVICE" ADD CONSTRAINT "SERVICE_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "DOCTOR"("doctor_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SERVICE_PARTICIPANT" ADD CONSTRAINT "SERVICE_PARTICIPANT_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "PATIENT"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SERVICE_PARTICIPANT" ADD CONSTRAINT "SERVICE_PARTICIPANT_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "SERVICE"("service_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TEST_INSTANCE" ADD CONSTRAINT "TEST_INSTANCE_test_template_version_ID_fkey" FOREIGN KEY ("test_template_version_ID") REFERENCES "TEST_TEMPLATE_VERSION"("test_template_version_ID") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TEST_INSTANCE" ADD CONSTRAINT "TEST_INSTANCE_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "PATIENT"("patient_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TEST_TEMPLATE_VERSION" ADD CONSTRAINT "TEST_TEMPLATE_VERSION_test_template_id_fkey" FOREIGN KEY ("test_template_id") REFERENCES "TEST_TEMPLATE"("test_template_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "USER_ROLES" ADD CONSTRAINT "USER_ROLES_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "ROLE"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "USER_ROLES" ADD CONSTRAINT "USER_ROLES_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
