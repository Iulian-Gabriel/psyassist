import { PrismaClient, ServiceTypesEnum } from "@prisma/client";
import { faker } from "@faker-js/faker";
import * as employeeService from "../services/employeeService";
import * as userService from "../services/userService";
import prisma from "../utils/prisma";

// --- Configuration ---
const NUM_DOCTORS = 4;
const NUM_PATIENTS_WITH_SERVICES = 20;
const NUM_NEW_PATIENTS_NO_SERVICES = 5;
const NUM_SERVICES = 30;
const NUM_SERVICE_REQUESTS = 15;
const NUM_PATIENT_FORMS = 10;

const generatePhoneNumber = () => {
  return `+1-${faker.string.numeric(3)}-${faker.string.numeric(
    3
  )}-${faker.string.numeric(4)}`;
};

async function main() {
  console.log("🌱 Starting the advanced seeding process...");
  console.log(
    "⚠️  NOTE: This script uses your application's service layer for user/employee creation. " +
      "Ensure you have run initDb.ts first to set up roles and permissions."
  );

  console.log(
    "🗑️  Cleaning the database (keeping roles/permissions and service types)..."
  );
  // Order of deletion matters due to foreign key constraints
  await prisma.serviceRequest.deleteMany();
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
  // ServiceType will be upserted, so explicit deletion is not needed here
  // await prisma.serviceType.deleteMany();
  console.log("✅ Database cleaned. Roles and Permissions preserved.");

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
  const receptionistRole = await prisma.role.findUniqueOrThrow({
    where: { role_name: "receptionist" },
  });
  console.log("✅ Roles fetched successfully.");

  console.log("📝 Creating ServiceType DB records...");
  // These are records in the SERVICE_TYPE table, not the enum members themselves
  const generalConsultationTypeDb = await prisma.serviceType.upsert({
    where: { name: "General Consultation" },
    update: {},
    create: {
      name: "General Consultation",
      description: "A standard one-on-one consultation with a doctor.",
      duration_minutes: 60,
      active: true,
    },
  });

  const followUpSessionTypeDb = await prisma.serviceType.upsert({
    where: { name: "Follow-up Session" },
    update: {},
    create: {
      name: "Follow-up Session",
      description:
        "A follow-up consultation to review progress or discuss results.",
      duration_minutes: 30,
      active: true,
    },
  });

  const groupTherapyTypeDb = await prisma.serviceType.upsert({
    where: { name: "Group Therapy" },
    update: {},
    create: {
      name: "Group Therapy",
      description: "A therapy session conducted with multiple patients.",
      duration_minutes: 90,
      active: true,
    },
  });

  // Array of all ServiceType DB records
  const allServiceTypeDbRecords = [
    generalConsultationTypeDb,
    followUpSessionTypeDb,
    groupTherapyTypeDb,
  ];

  console.log("✅ ServiceType DB records created/upserted.");

  // --- Section for creating predictable, static accounts for testing ---
  console.log("\n👤 Creating specific test accounts for each role...");

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
  const staticDoctorData = await employeeService.createEmployeeWithRole(
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
  const staticDoctor = staticDoctorData.doctor!;
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
  const staticPatient = await prisma.patient.create({
    data: {
      user: {
        create: {
          email: "patient@psyassist.com",
          password_hash: await userService.hashPassword("Patient123!"),
          first_name: "Patricia",
          last_name: "Patient",
          date_of_birth: new Date("1992-07-30"),
          gender: "female",
          phone_number: generatePhoneNumber(),
          address_street: faker.location.streetAddress(),
          address_city: faker.location.city(),
          address_postal_code: faker.location.zipCode(),
          address_country: faker.location.country(),
          address_county: faker.location.county(),
        },
      },
      emergency_contact_name: faker.person.fullName(),
      emergency_contact_phone: generatePhoneNumber(),
      tos_accepted: true,
      gdpr_accepted: true,
      tos_accepted_date: new Date(),
      gdpr_accepted_date: new Date(),
    },
    include: {
      user: true,
    },
  });
  await prisma.userRoles.create({
    data: { user_id: staticPatient.user_id, role_id: patientRole.role_id },
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
    "Child Psychology",
    "Addiction Counseling",
  ];
  for (let i = 0; i < NUM_DOCTORS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const result = await employeeService.createEmployeeWithRole(
      {
        email: `doctor.${lastName.toLowerCase()}${faker.string.numeric(
          3
        )}@psyassist.com`,
        password: "Doctor123!",
        first_name: firstName,
        last_name: lastName,
        date_of_birth: faker.date.birthdate({ min: 30, max: 65, mode: "age" }),
        gender: faker.helpers.arrayElement(["male", "female"]),
        phone_number: generatePhoneNumber(),
        address_street: faker.location.streetAddress(),
        address_city: faker.location.city(),
        address_postal_code: faker.location.zipCode(),
        address_country: faker.location.country(),
        address_county: faker.location.county(),
      },
      {
        job_title: "Psychologist",
        hire_date: faker.date.past({ years: 5 }),
      },
      "doctor",
      {
        specialization: faker.helpers.arrayElement(specializations),
        bio: faker.lorem.paragraph(),
      }
    );
    if (result.doctor) doctors.push(result.doctor);
  }
  doctors.push(staticDoctor);
  console.log(
    `✅ Created ${doctors.length} random Doctor users (including static).`
  );

  console.log(
    `👤 Creating ${NUM_PATIENTS_WITH_SERVICES} random Patient users (some with services)...`
  );
  const patientsWithServices = [];
  for (let i = 0; i < NUM_PATIENTS_WITH_SERVICES; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const patient = await prisma.patient.create({
      data: {
        user: {
          create: {
            email: `patient.${lastName.toLowerCase()}${faker.string.numeric(
              3
            )}@example.com`,
            password_hash: await userService.hashPassword("Patient123!"),
            first_name: firstName,
            last_name: lastName,
            date_of_birth: faker.date.birthdate({
              min: 18,
              max: 80,
              mode: "age",
            }),
            gender: faker.helpers.arrayElement([
              "male",
              "female",
              "unspecified",
            ]),
            phone_number: generatePhoneNumber(),
            address_street: faker.location.streetAddress(),
            address_city: faker.location.city(),
            address_postal_code: faker.location.zipCode(),
            address_country: faker.location.country(),
            address_county: faker.location.county(),
          },
        },
        emergency_contact_name: faker.person.fullName(),
        emergency_contact_phone: generatePhoneNumber(),
        tos_accepted: true,
        gdpr_accepted: true,
        tos_accepted_date: new Date(),
        gdpr_accepted_date: new Date(),
      },
      include: {
        user: true,
      },
    });
    await prisma.userRoles.create({
      data: { user_id: patient.user_id, role_id: patientRole.role_id },
    });
    patientsWithServices.push(patient);
  }
  patientsWithServices.push(staticPatient);
  console.log(
    `✅ Created ${patientsWithServices.length} random Patient users (including static).`
  );

  console.log(
    `🆕 Creating ${NUM_NEW_PATIENTS_NO_SERVICES} new patients with no appointments...`
  );
  const newPatients = [];
  for (let i = 0; i < NUM_NEW_PATIENTS_NO_SERVICES; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const patient = await prisma.patient.create({
      data: {
        user: {
          create: {
            email: `new.patient.${lastName.toLowerCase()}${faker.string.numeric(
              3
            )}@example.com`,
            password_hash: await userService.hashPassword("NewPatient123!"),
            first_name: firstName,
            last_name: lastName,
            date_of_birth: faker.date.birthdate({
              min: 18,
              max: 40,
              mode: "age",
            }),
            gender: faker.helpers.arrayElement([
              "male",
              "female",
              "unspecified",
            ]),
            phone_number: generatePhoneNumber(),
            address_street: faker.location.streetAddress(),
            address_city: faker.location.city(),
            address_postal_code: faker.location.zipCode(),
            address_country: faker.location.country(),
            address_county: faker.location.county(),
          },
        },
        emergency_contact_name: faker.person.fullName(),
        emergency_contact_phone: generatePhoneNumber(),
        tos_accepted: true,
        gdpr_accepted: true,
        tos_accepted_date: new Date(),
        gdpr_accepted_date: new Date(),
      },
      include: {
        user: true,
      },
    });
    await prisma.userRoles.create({
      data: { user_id: patient.user_id, role_id: patientRole.role_id },
    });
    newPatients.push(patient);
  }
  console.log(
    `✅ Created ${newPatients.length} new patients with no appointments.`
  );

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
      termination_date: faker.date.past({
        years: 1,
        refDate: new Date("2024-01-01"),
      }),
    },
    "doctor",
    { specialization: "Forensic Psychology" }
  );
  await prisma.user.update({
    where: { user_id: terminatedDoctorResult.user.user_id },
    data: { is_active: false },
  });
  console.log("✅ Terminated employee created.");

  // Create some past services for the terminated doctor
  console.log("Adding past services for the terminated doctor...");
  const terminatedDoctor = terminatedDoctorResult.doctor!;
  for (let i = 0; i < 3; i++) {
    const pastPatient = faker.helpers.arrayElement(patientsWithServices);
    const pastStartTime = faker.date.between({
      from: new Date("2022-01-01"),
      to: terminatedDoctorResult.employee!.termination_date!,
    });
    const pastService = await prisma.service.create({
      data: {
        employee_id: terminatedDoctor.doctor_id,
        service_type: ServiceTypesEnum.Consultation, // Direct enum value: This fixes the previous error!
        start_time: pastStartTime,
        end_time: new Date(pastStartTime.getTime() + 60 * 60 * 1000),
        status: "Completed",
        cancel_reason: null,
      },
    });
    await prisma.serviceParticipant.create({
      data: {
        service_id: pastService.service_id,
        patient_id: pastPatient.patient_id,
        attendance_status: "Attended",
      },
    });
    console.log(
      `  -> Past service ${pastService.service_id} for terminated doctor.`
    );
  }
  console.log("✅ Past services for terminated doctor added.");

  console.log("\n📝 Creating Test Templates...");
  type QuestionType = {
    question: string;
    type: "MULTIPLE_CHOICE" | "SCALE" | string;
    required: boolean;
    options?: { text: string; value: number }[];
    minValue?: number;
    maxValue?: number;
  };

  const gad7Description = {
    description:
      "The GAD-7 is a self-administered patient questionnaire used as a screening tool and severity measure for generalized anxiety disorder.",
  };
  const gad7Questions: QuestionType[] = [
    {
      question: "Feeling nervous, anxious, or on edge",
      type: "MULTIPLE_CHOICE",
      required: true,
      options: [
        { text: "Not at all", value: 0 },
        { text: "Several days", value: 1 },
        { text: "More than half the days", value: 2 },
        { text: "Nearly every day", value: 3 },
      ],
    },
    {
      question: "Not being able to stop or control worrying",
      type: "MULTIPLE_CHOICE",
      required: true,
      options: [
        { text: "Not at all", value: 0 },
        { text: "Several days", value: 1 },
        { text: "More than half the days", value: 2 },
        { text: "Nearly every day", value: 3 },
      ],
    },
    {
      question: "Worrying too much about different things",
      type: "MULTIPLE_CHOICE",
      required: true,
      options: [
        { text: "Not at all", value: 0 },
        { text: "Several days", value: 1 },
        { text: "More than half the days", value: 2 },
        { text: "Nearly every day", value: 3 },
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
  const phq9Questions: QuestionType[] = [
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
    {
      question: "Trouble falling or staying asleep, or sleeping too much",
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

  // --- Specific completed service between static patient and doctor ---
  console.log(
    "\n📅 Creating specific completed service between static patient and doctor..."
  );
  const specificServiceStartTime = faker.date.past({ years: 0.5 });
  const specificService = await prisma.service.create({
    data: {
      employee_id: staticDoctor.doctor_id,
      service_type: ServiceTypesEnum.Consultation, // Direct enum value
      start_time: specificServiceStartTime,
      end_time: new Date(
        specificServiceStartTime.getTime() +
          generalConsultationTypeDb.duration_minutes * 60 * 1000
      ),
      status: "Completed",
    },
  });
  const specificServiceParticipant = await prisma.serviceParticipant.create({
    data: {
      service_id: specificService.service_id,
      patient_id: staticPatient.patient_id,
      attendance_status: "Attended",
    },
  });
  console.log(
    `  -> Completed service ID ${specificService.service_id} for ${staticPatient.user.email} with ${staticDoctorData.user.email}`
  );

  // Add notes for the specific service
  await prisma.notes.create({
    data: {
      doctor_id: staticDoctor.doctor_id,
      patient_id: staticPatient.patient_id,
      service_id: specificService.service_id,
      participant_id: specificServiceParticipant.participant_id,
      content:
        "Patient presented with general anxiety symptoms. Discussed coping mechanisms and scheduled a follow-up.",
    },
  });
  console.log("  -> Added notes for specific service.");

  // Add notices for the specific service
  await prisma.notices.create({
    data: {
      service_id: specificService.service_id,
      participant_id: specificServiceParticipant.participant_id,
      issue_date: new Date(),
      unique_notice_number: faker.string.uuid(),
      expiry_date: faker.date.future({ years: 1 }),
      reason_for_issuance: "Recommendation for follow-up.",
      fitness_status: "Fit for work",
      recommendations: "Engage in daily mindfulness exercises.",
      attachment_path: null,
    },
  });
  console.log("  -> Added notices for specific service.");

  // Add feedback for the specific service
  await prisma.feedback.create({
    data: {
      service_id: specificService.service_id,
      participant_id: specificServiceParticipant.participant_id,
      rating_score: 5,
      comments: "Excellent consultation, very helpful and empathetic doctor.",
      submission_date: faker.date.recent({
        refDate: specificService.end_time,
        days: 7,
      }),
      is_anonymous: false,
      target_type: "SERVICE", // Can be 'DOCTOR' or 'SERVICE'
      is_clean_facilities: true,
      is_friendly_staff: true,
      is_easy_accessibility: true,
      is_smooth_admin_process: true,
    },
  });
  console.log("  -> Added feedback for specific service.");

  // Add test instance for the specific service
  const specificTestVersion = faker.helpers.arrayElement(testVersions);
  if (specificTestVersion.questionsJson) {
    // Ensure questionsJson is not null
    const questions = specificTestVersion.questionsJson as QuestionType[]; // Cast to the defined type

    await prisma.testInstance.create({
      data: {
        patient_id: staticPatient.patient_id,
        test_template_version_ID: specificTestVersion.test_template_version_ID,
        testStartDate: specificServiceStartTime,
        testStopDate: new Date(
          specificServiceStartTime.getTime() + 10 * 60 * 1000
        ), // 10 minutes later
        patientResponse: {
          answers: questions.map((q: QuestionType) => ({
            question: q.question,
            answer:
              q.type === "MULTIPLE_CHOICE"
                ? faker.helpers.arrayElement(q.options!).text
                : faker.number.int({ min: q.minValue!, max: q.maxValue! }),
          })),
        },
      },
    });
  }
  console.log("  -> Added test instance for specific service.");

  console.log(`\n📅 Creating ${NUM_SERVICES} random Services...`);
  const allPatients = [...patientsWithServices, ...newPatients];
  for (let i = 0; i < NUM_SERVICES; i++) {
    const randomDoctor = faker.helpers.arrayElement(doctors);

    // Randomly pick between Consultation and Group_Consultation enum types
    const serviceTypeEnum = faker.helpers.arrayElement([
      ServiceTypesEnum.Consultation,
      ServiceTypesEnum.Group_Consultation,
    ]);

    // Determine the duration based on the chosen enum
    const durationMinutes =
      serviceTypeEnum === ServiceTypesEnum.Consultation
        ? generalConsultationTypeDb.duration_minutes
        : groupTherapyTypeDb.duration_minutes; // Assuming only these two map to enums

    const isGroup = serviceTypeEnum === ServiceTypesEnum.Group_Consultation;
    const numParticipants = isGroup ? faker.number.int({ min: 2, max: 5 }) : 1;
    const participantsForService = faker.helpers.arrayElements(
      patientsWithServices,
      {
        min: numParticipants,
        max: numParticipants,
      }
    );

    const serviceStatus =
      i < 15
        ? "Completed"
        : faker.helpers.arrayElement(["Scheduled", "Cancelled"]);

    const startTime = faker.date.between({
      from: new Date("2024-06-01"),
      to: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    });

    const service = await prisma.service.create({
      data: {
        employee_id: randomDoctor.doctor_id,
        service_type: serviceTypeEnum, // Directly use the enum value
        start_time: startTime,
        end_time: new Date(startTime.getTime() + durationMinutes * 60 * 1000),
        status: serviceStatus,
        cancel_reason:
          serviceStatus === "Cancelled" ? faker.lorem.sentence(3) : null,
      },
    });

    for (const patient of participantsForService) {
      const participant = await prisma.serviceParticipant.create({
        data: {
          service_id: service.service_id,
          patient_id: patient.patient_id,
          attendance_status: faker.helpers.arrayElement([
            "Attended",
            "Missed",
            "Expected",
          ]),
        },
      });

      if (service.status === "Completed") {
        if (Math.random() < 0.7) {
          await prisma.notes.create({
            data: {
              doctor_id: randomDoctor.doctor_id,
              patient_id: patient.patient_id,
              service_id: service.service_id,
              participant_id: participant.participant_id,
              content: `Follow-up notes for ${faker.person.fullName({
                firstName: patient.user.first_name,
                lastName: patient.user.last_name,
              })}: ${faker.lorem.paragraph(2)}`,
            },
          });
        }

        if (Math.random() < 0.6) {
          await prisma.feedback.create({
            data: {
              service_id: service.service_id,
              participant_id: participant.participant_id,
              rating_score: faker.number.int({ min: 3, max: 5 }),
              comments: faker.lorem.sentence(5),
              submission_date: faker.date.recent({
                refDate: service.end_time,
                days: 7,
              }),
              is_anonymous: faker.datatype.boolean(),
              target_type: faker.helpers.arrayElement(["DOCTOR", "SERVICE"]),
              is_clean_facilities: faker.datatype.boolean(),
              is_friendly_staff: faker.datatype.boolean(),
              is_easy_accessibility: faker.datatype.boolean(),
              is_smooth_admin_process: faker.datatype.boolean(),
            },
          });
        }

        if (Math.random() < 0.3) {
          await prisma.notices.create({
            data: {
              service_id: service.service_id,
              participant_id: participant.participant_id,
              issue_date: faker.date.recent({ refDate: service.end_time }),
              unique_notice_number: faker.string.uuid(),
              expiry_date: faker.date.future({
                years: 1,
                refDate: service.end_time,
              }),
              reason_for_issuance: faker.lorem.sentence(4),
              fitness_status: faker.helpers.arrayElement([
                "Fit for work",
                "Rest recommended",
                "Further assessment needed",
              ]),
              recommendations: faker.lorem.paragraph(1),
              attachment_path:
                Math.random() > 0.5 ? faker.internet.url() : null,
            },
          });
        }

        if (Math.random() < 0.4) {
          const randomTestVersion = faker.helpers.arrayElement(testVersions);
          if (randomTestVersion.questionsJson) {
            const questions = randomTestVersion.questionsJson as QuestionType[];
            await prisma.testInstance.create({
              data: {
                patient_id: patient.patient_id,
                test_template_version_ID:
                  randomTestVersion.test_template_version_ID,
                testStartDate: faker.date.recent({
                  refDate: service.end_time,
                  days: 5,
                }),
                testStopDate: faker.date.recent({
                  refDate: service.end_time,
                  days: 1,
                }),
                patientResponse: {
                  answers: questions.map((q) => ({
                    question: q.question,
                    answer:
                      q.type === "MULTIPLE_CHOICE"
                        ? faker.helpers.arrayElement(q.options!).text
                        : faker.number.int({
                            min: q.minValue!,
                            max: q.maxValue!,
                          }),
                  })),
                },
              },
            });
          }
        }
      }
    }
  }
  console.log(
    "✅ Services, Participants, Notes, Feedback, Notices, and Test Instances created."
  );

  console.log(`\n📬 Creating ${NUM_SERVICE_REQUESTS} Service Requests...`);
  const preferredTimes = ["morning", "afternoon", "evening"];
  for (let i = 0; i < NUM_SERVICE_REQUESTS; i++) {
    const randomPatient = faker.helpers.arrayElement(allPatients);
    // Pick a ServiceType DB record to link the ServiceRequest to
    const randomServiceTypeDbRecord = faker.helpers.arrayElement(
      allServiceTypeDbRecords
    );

    const preferredDoctor = faker.helpers.arrayElement([
      ...doctors,
      null, // Some requests might not specify a preferred doctor
    ]);

    // Use a base date for calculation
    const baseDate = new Date();

    const preferredDate1 = new Date(baseDate);
    preferredDate1.setDate(
      baseDate.getDate() + faker.number.int({ min: 1, max: 30 })
    );

    const preferredDate2 =
      Math.random() > 0.5 ? new Date(preferredDate1) : null;
    if (preferredDate2) {
      preferredDate2.setDate(
        preferredDate1.getDate() + faker.number.int({ min: 1, max: 7 })
      );
    }

    const preferredDate3 =
      Math.random() > 0.7 ? new Date(preferredDate2 || preferredDate1) : null;
    if (preferredDate3) {
      preferredDate3.setDate(
        (preferredDate2 || preferredDate1).getDate() +
          faker.number.int({ min: 1, max: 7 })
      );
    }

    await prisma.serviceRequest.create({
      data: {
        patient_id: randomPatient.patient_id,
        service_type_id: randomServiceTypeDbRecord.service_type_id, // Use ID from the ServiceType DB record
        preferred_doctor_id: preferredDoctor ? preferredDoctor.doctor_id : null,
        preferred_date_1: preferredDate1,
        preferred_date_2: preferredDate2,
        preferred_date_3: preferredDate3,
        preferred_time: faker.helpers.arrayElement(preferredTimes),
        reason: faker.lorem.sentence(10),
        urgent: faker.datatype.boolean(),
        additional_notes: Math.random() > 0.5 ? faker.lorem.sentence(5) : null,
        status: faker.helpers.arrayElement(["pending", "approved", "rejected"]),
      },
    });
  }
  console.log("✅ Service Requests created.");

  console.log(`\n📄 Creating ${NUM_PATIENT_FORMS} Patient Forms...`);
  for (let i = 0; i < NUM_PATIENT_FORMS; i++) {
    const randomPatient = faker.helpers.arrayElement(allPatients);
    await prisma.patientForm.create({
      data: {
        patient_id: randomPatient.patient_id,
        submission_date: faker.date.past({ years: 1 }),
        form_data: {
          medicalHistory: faker.lorem.paragraph(2),
          allergies: faker.helpers.arrayElements(
            ["Pollen", "Dust", "Peanuts", "None"],
            { min: 0, max: 2 }
          ),
          medications: faker.helpers.arrayElements(
            ["Aspirin", "Ibuprofen", "Prozac", "None"],
            { min: 0, max: 2 }
          ),
          lifestyle: {
            smoking: faker.datatype.boolean(),
            alcoholConsumption: faker.helpers.arrayElement([
              "none",
              "light",
              "moderate",
              "heavy",
            ]),
          },
        },
        status: faker.helpers.arrayElement(["Submitted", "Reviewed"]),
      },
    });
  }
  console.log("✅ Patient Forms created.");

  console.log("\n🎉 Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ An error occurred during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
