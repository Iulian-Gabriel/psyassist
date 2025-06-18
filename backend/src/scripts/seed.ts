// src/scripts/seed.ts

import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import * as employeeService from "../services/employeeService";
import * as userService from "../services/userService";
import prisma from "../utils/prisma";

// --- Configuration ---
const NUM_DOCTORS = 4;
const NUM_PATIENTS = 25;
const NUM_SERVICES = 30;
const BCRYPT_SALT_ROUNDS = 10;

const generatePhoneNumber = () => {
  return `555-${faker.string.numeric(3)}-${faker.string.numeric(4)}`;
};

async function main() {
  console.log("🌱 Starting the advanced seeding process...");
  console.log(
    "⚠️  NOTE: This script uses your application's service layer. Ensure you have run initDb.ts first."
  );

  console.log("🗑️  Cleaning the database (keeping roles/permissions)...");
  await prisma.feedback.deleteMany();
  await prisma.notes.deleteMany();
  await prisma.notices.deleteMany();
  await prisma.serviceParticipant.deleteMany();
  await prisma.testInstance.deleteMany();
  await prisma.service.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.userRoles.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.patientForm.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.testTemplateVersion.deleteMany();
  await prisma.testTemplate.deleteMany();
  console.log("✅ Database cleaned.");

  console.log("🔍 Fetching existing roles...");
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { role_name: "admin" },
  });
  const doctorRole = await prisma.role.findUniqueOrThrow({
    where: { role_name: "doctor" },
  });
  const patientRole = await prisma.role.findUniqueOrThrow({
    where: { role_name: "patient" },
  });
  // --- NEW: Fetch the receptionist role ---
  const receptionistRole = await prisma.role.findUniqueOrThrow({
    where: { role_name: "receptionist" },
  });
  console.log("✅ Roles fetched successfully.");

  // --- Section for creating predictable, static accounts for testing ---
  console.log("👤 Creating specific test accounts for each role...");

  // 1. Admin Account
  await employeeService.createEmployeeWithRole(
    {
      email: "admin@psyassist.com",
      password: "Admin123!",
      first_name: "System",
      last_name: "Admin",
      date_of_birth: new Date("1980-01-01"),
      phone_number: generatePhoneNumber(),
    },
    { job_title: "System Administrator", hire_date: new Date() },
    "admin"
  );
  console.log("  -> ✅ Admin: admin@psyassist.com / Admin123!");

  // 2. Doctor Account
  await employeeService.createEmployeeWithRole(
    {
      email: "doctor@psyassist.com",
      password: "Doctor123!",
      first_name: "Diana",
      last_name: "Doctor",
      date_of_birth: new Date("1985-05-20"),
      phone_number: generatePhoneNumber(),
    },
    { job_title: "Psychologist", hire_date: new Date("2022-08-15") },
    "doctor",
    {
      specialization: "Cognitive Behavioral Therapy",
      bio: "Dr. Diana specializes in CBT and patient-focused therapy.",
    }
  );
  console.log("  -> ✅ Doctor: doctor@psyassist.com / Doctor123!");

  // 3. Receptionist Account
  await employeeService.createEmployeeWithRole(
    {
      email: "receptionist@psyassist.com",
      password: "Receptionist123!",
      first_name: "Robert",
      last_name: "Receptionist",
      date_of_birth: new Date("1990-11-10"),
      phone_number: generatePhoneNumber(),
    },
    { job_title: "Front Desk Coordinator", hire_date: new Date("2023-01-20") },
    "receptionist"
  );
  console.log(
    "  -> ✅ Receptionist: receptionist@psyassist.com / Receptionist123!"
  );

  // 4. Patient Account
  const patientUser = await prisma.user.create({
    data: {
      email: "patient@psyassist.com",
      password_hash: await userService.hashPassword("Patient123!"),
      first_name: "Patricia",
      last_name: "Patient",
      date_of_birth: new Date("1992-07-30"),
      gender: "female",
      phone_number: generatePhoneNumber(),
    },
  });
  await prisma.userRoles.create({
    data: { user_id: patientUser.user_id, role_id: patientRole.role_id },
  });
  await prisma.patient.create({
    data: {
      user_id: patientUser.user_id,
      emergency_contact_name: "Peter Patient",
      emergency_contact_phone: generatePhoneNumber(),
      tos_accepted: true,
      gdpr_accepted: true,
      tos_accepted_date: new Date(),
      gdpr_accepted_date: new Date(),
    },
  });
  console.log("  -> ✅ Patient: patient@psyassist.com / Patient123!");

  // --- Section for creating random data for volume testing ---
  console.log("\n🌱 Creating random data for volume...");

  console.log(`🧑‍⚕️ Creating ${NUM_DOCTORS} random Doctor users...`);
  const doctors = [];
  const specializations = [
    "Clinical Psychology",
    "Family Therapy",
    "Neuropsychology",
  ];
  for (let i = 0; i < NUM_DOCTORS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const result = await employeeService.createEmployeeWithRole(
      {
        email: `doctor.${lastName.toLowerCase()}${i}@psyassist.com`,
        password: "Doctor123!",
        first_name: firstName,
        last_name: lastName,
        date_of_birth: faker.date.birthdate({ min: 30, max: 65, mode: "age" }),
        gender: faker.helpers.arrayElement(["male", "female"]),
        phone_number: generatePhoneNumber(),
      },
      {
        job_title: "Psychologist",
        hire_date: faker.date.past({ years: 5 }),
      },
      "doctor",
      {
        specialization: specializations[i % specializations.length],
        bio: faker.lorem.paragraph(),
      }
    );
    if (result.doctor) doctors.push(result.doctor);
  }
  console.log(`✅ Created ${doctors.length} random Doctor users.`);

  console.log(`👤 Creating ${NUM_PATIENTS} random Patient users...`);
  const patients = [];
  for (let i = 0; i < NUM_PATIENTS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const user = await prisma.user.create({
      data: {
        email: `patient.${lastName.toLowerCase()}${i}@example.com`,
        password_hash: await userService.hashPassword("Patient123!"),
        first_name: firstName,
        last_name: lastName,
        date_of_birth: faker.date.birthdate({ min: 18, max: 80, mode: "age" }),
        gender: faker.helpers.arrayElement(["male", "female", "unspecified"]),
        phone_number: generatePhoneNumber(),
      },
    });
    await prisma.userRoles.create({
      data: { user_id: user.user_id, role_id: patientRole.role_id },
    });
    const patient = await prisma.patient.create({
      data: {
        user_id: user.user_id,
        emergency_contact_name: faker.person.fullName(),
        emergency_contact_phone: generatePhoneNumber(),
        tos_accepted: true,
        gdpr_accepted: true,
        tos_accepted_date: new Date(),
        gdpr_accepted_date: new Date(),
      },
    });
    patients.push(patient);
  }
  console.log(`✅ Created ${patients.length} random Patient users.`);

  // ... The rest of the script (Test Templates, Services, etc.) is unchanged ...
  console.log("📝 Creating Test Templates...");
  const gad7Description = {
    description:
      "The GAD-7 is a self-administered patient questionnaire used as a screening tool and severity measure for generalized anxiety disorder.",
  };
  const gad7Questions = [
    {
      question: "Feeling nervous, anxious, or on edge",
      type: "MULTIPLE_CHOICE",
      required: true,
      options: [
        "Not at all",
        "Several days",
        "More than half the days",
        "Nearly every day",
      ],
    },
    {
      question: "Not being able to stop or control worrying",
      type: "MULTIPLE_CHOICE",
      required: true,
      options: [
        "Not at all",
        "Several days",
        "More than half the days",
        "Nearly every day",
      ],
    },
  ];
  const gad7Template = await prisma.testTemplate.create({
    data: {
      name: "GAD-7 Anxiety Screen",
      isActive: true,
      isExternal: false,
      template_questions: gad7Description,
    },
  });
  const gad7Version = await prisma.testTemplateVersion.create({
    data: {
      test_template_id: gad7Template.test_template_id,
      version: 1,
      questionsJson: gad7Questions,
    },
  });

  const phq9Description = {
    description:
      "The PHQ-9 is a multipurpose instrument for screening, diagnosing, monitoring and measuring the severity of depression.",
  };
  const phq9Questions = [
    {
      question: "Little interest or pleasure in doing things",
      type: "SCALE",
      required: true,
      minValue: 0,
      maxValue: 3,
    },
    {
      question: "Feeling down, depressed, or hopeless",
      type: "SCALE",
      required: true,
      minValue: 0,
      maxValue: 3,
    },
  ];
  const phq9Template = await prisma.testTemplate.create({
    data: {
      name: "PHQ-9 Depression Screen",
      isActive: true,
      isExternal: false,
      template_questions: phq9Description,
    },
  });
  const phq9Version = await prisma.testTemplateVersion.create({
    data: {
      test_template_id: phq9Template.test_template_id,
      version: 1,
      questionsJson: phq9Questions,
    },
  });
  const testVersions = [gad7Version, phq9Version];
  console.log("✅ Test Templates and Versions created.");

  console.log(`🗓️  Creating ${NUM_SERVICES} Services and related data...`);
  for (let i = 0; i < NUM_SERVICES; i++) {
    const randomDoctor = faker.helpers.arrayElement(doctors);
    const isGroup = Math.random() > 0.8;
    const participants = isGroup
      ? faker.helpers.arrayElements(patients, { min: 2, max: 4 })
      : [faker.helpers.arrayElement(patients)];
    const startTime = faker.date.between({
      from: new Date(),
      to: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    });
    const service = await prisma.service.create({
      data: {
        employee_id: randomDoctor.doctor_id,
        service_type: isGroup ? "Group_Consultation" : "Consultation",
        start_time: startTime,
        end_time: faker.date.future({ refDate: startTime }),
        status: faker.helpers.arrayElement([
          "Scheduled",
          "Completed",
          "Completed",
          "Cancelled",
        ]),
      },
    });
    for (const patient of participants) {
      const participant = await prisma.serviceParticipant.create({
        data: {
          service_id: service.service_id,
          patient_id: patient.patient_id,
        },
      });
      if (service.status === "Completed") {
        await prisma.notes.create({
          data: {
            service_id: service.service_id,
            participant_id: participant.participant_id,
            content: `Follow-up notes for ${
              patient.patient_id
            }: ${faker.lorem.sentence()}`,
          },
        });
        await prisma.feedback.create({
          data: {
            service_id: service.service_id,
            participant_id: participant.participant_id,
            rating_score: faker.number.int({ min: 3, max: 5 }),
            comments: faker.lorem.paragraph(),
            target_type: "DOCTOR",
          },
        });
        if (Math.random() > 0.5) {
          const randomTestVersion = faker.helpers.arrayElement(testVersions);
          await prisma.testInstance.create({
            data: {
              patient_id: patient.patient_id,
              test_template_version_ID:
                randomTestVersion.test_template_version_ID,
              testStartDate: service.start_time,
              testStopDate: service.end_time,
              patientResponse: {
                answers: [
                  { question: "Q1", answer: faker.lorem.words(3) },
                  {
                    question: "Q2",
                    answer: faker.number.int({ min: 0, max: 3 }),
                  },
                ],
              },
            },
          });
        }
      }
    }
  }
  console.log("✅ Services, Participants, and Test Instances created.");

  console.log("👻 Creating edge case: Terminated Employee...");
  const terminatedDoctorResult = await employeeService.createEmployeeWithRole(
    {
      email: "terminated.doctor@psyassist.com",
      password: "Password123!",
      first_name: "Terry",
      last_name: "Terminated",
      date_of_birth: new Date("1975-05-10"),
      phone_number: generatePhoneNumber(),
    },
    {
      job_title: "Former Psychologist",
      hire_date: faker.date.past({ years: 10 }),
      termination_date: faker.date.past({ years: 1 }),
    },
    "doctor",
    { specialization: "Forensic Psychology" }
  );
  await prisma.user.update({
    where: { user_id: terminatedDoctorResult.user.user_id },
    data: { is_active: false },
  });
  console.log("✅ Terminated employee created.");

  console.log("\n🎉 Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ An error occurred during seeding:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
