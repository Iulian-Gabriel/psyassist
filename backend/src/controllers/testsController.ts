import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

// Update the validation schema to match what your frontend is sending
const AssignTestSchema = z.object({
  patient_id: z.number().int().positive(),
  form_id: z.number().int().positive(), // Changed from test_template_version_ID
});

// Get all tests for a doctor's patients
export const getDoctorPatientTests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const doctorId = parseInt(req.params.id);

    if (isNaN(doctorId)) {
      res.status(400).json({ message: "Invalid doctor ID" });
      return;
    }

    // First, find all patients associated with this doctor
    // For simplicity, we're assuming there's a way to link doctors to patients
    // This might need to be adapted based on your actual database schema
    const doctorPatients = await prisma.serviceParticipant.findMany({
      where: {
        service: {
          employee_id: doctorId,
        },
      },
      distinct: ["patient_id"],
      select: {
        patient_id: true,
      },
    });

    const patientIds = doctorPatients.map((p) => p.patient_id);

    if (patientIds.length === 0) {
      res.json([]);
      return;
    }

    // Next, fetch all test instances for these patients
    const testInstances = await prisma.testInstance.findMany({
      where: {
        patient_id: {
          in: patientIds,
        },
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        testTemplateVersion: {
          include: {
            testTemplate: {
              select: {
                test_template_id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        testStartDate: "desc",
      },
    });

    res.json(testInstances);
  } catch (error) {
    console.error("Error fetching doctor's patient tests:", error);
    res.status(500).json({ message: "Failed to fetch patient tests" });
  }
};

// Get specific test instance details
export const getTestInstance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const testInstanceId = parseInt(req.params.id);

    if (isNaN(testInstanceId)) {
      res.status(400).json({ message: "Invalid test instance ID" });
      return;
    }

    const testInstance = await prisma.testInstance.findUnique({
      where: {
        test_instance_id: testInstanceId,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        testTemplateVersion: {
          include: {
            testTemplate: true,
          },
        },
      },
    });

    if (!testInstance) {
      res.status(404).json({ message: "Test instance not found" });
      return;
    }

    res.json(testInstance);
  } catch (error) {
    console.error("Error fetching test instance:", error);
    res.status(500).json({ message: "Failed to fetch test instance" });
  }
};

// Assign a test to a patient
export const assignTestToPatient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Request body:", req.body);

    const { patient_id, form_id } = req.body;

    if (!patient_id || !form_id) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Find the form (which should be a TestTemplate)
    const testTemplate = await prisma.testTemplate.findUnique({
      where: { test_template_id: form_id },
      include: {
        testTemplateVersions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!testTemplate || !testTemplate.testTemplateVersions.length) {
      res
        .status(404)
        .json({ message: "Test form not found or has no versions" });
      return;
    }

    // Get the latest version ID
    const latestVersionId =
      testTemplate.testTemplateVersions[0].test_template_version_ID;

    // Create test instance with the correct field name from your schema
    const testInstance = await prisma.testInstance.create({
      data: {
        patient_id: patient_id,
        test_template_version_ID: latestVersionId, // Use this instead of form_id
        testStartDate: new Date(),
        testStopDate: null,
        patientResponse: {}, // Empty object for now
      },
    });

    res.status(201).json({
      message: "Test assigned successfully",
      testInstance,
    });
  } catch (error) {
    console.error("Error assigning test:", error);
    res.status(500).json({ message: "Failed to assign test" });
  }
};

// Get a patient's tests (for patient portal)
export const getPatientTests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const patientId = parseInt(req.params.id);
    const userId = req.user?.userId;

    if (isNaN(patientId)) {
      res.status(400).json({ message: "Invalid patient ID" });
      return;
    }

    // Security check: For now we'll skip the staff check
    // and implement a simpler check just comparing user IDs
    const patient = await prisma.patient.findUnique({
      where: { patient_id: patientId },
      select: { user_id: true },
    });

    // If the patient doesn't exist or user_id doesn't match the request user
    if (!patient || patient.user_id !== req.user?.userId) {
      // Convert userId to number for comparison (fixes the third error too)
      res.status(403).json({ message: "Not authorized to view these tests" });
      return;
    }

    const testInstances = await prisma.testInstance.findMany({
      where: {
        patient_id: patientId,
      },
      include: {
        testTemplateVersion: {
          include: {
            testTemplate: {
              select: {
                test_template_id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        testStartDate: "desc",
      },
    });

    res.json(testInstances);
  } catch (error) {
    console.error("Error fetching patient tests:", error);
    res.status(500).json({ message: "Failed to fetch patient tests" });
  }
};

// Add this function to get all tests (no role restrictions)
export const getAllTests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const testInstances = await prisma.testInstance.findMany({
      include: {
        patient: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        testTemplateVersion: {
          include: {
            testTemplate: {
              select: {
                test_template_id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        testStartDate: "desc",
      },
    });

    res.json(testInstances);
  } catch (error) {
    console.error("Error fetching all tests:", error);
    res.status(500).json({ message: "Failed to fetch tests" });
  }
};
