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
    const user = req.user; // Get user info from the authenticated token

    if (isNaN(testInstanceId)) {
      res.status(400).json({ message: "Invalid test instance ID" });
      return;
    }

    // A small check to ensure the user object from the token is valid
    if (!user?.userId || !user.role) {
      res.status(401).json({ message: "User not authenticated properly" });
      return;
    }

    const testInstance = await prisma.testInstance.findUnique({
      where: { test_instance_id: testInstanceId },
      include: {
        // --- START OF CHANGE ---
        // Include patient and their associated user details
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
        // --- END OF CHANGE ---
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

    // --- NEW SECURITY CHECK ---
    // If the logged-in user has the 'patient' role, we MUST verify they own this test.
    if (user.role === "patient") {
      // Find the patient profile linked to the logged-in user
      const patientProfile = await prisma.patient.findUnique({
        where: { user_id: user.userId },
        select: { patient_id: true },
      });

      // If the patient profile doesn't exist, or if the test's patient_id
      // does not match the logged-in patient's ID, deny access.
      if (
        !patientProfile ||
        testInstance.patient_id !== patientProfile.patient_id
      ) {
        res
          .status(403)
          .json({ message: "You are not authorized to view this test." });
        return;
      }
    }
    // If the user is a 'doctor' or 'admin', they can proceed without this check.
    // --- END OF SECURITY CHECK ---

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
    const userId = req.user?.userId; // Get the ID from the token

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Find the patient record associated with this user ID
    const patient = await prisma.patient.findUnique({
      where: { user_id: userId },
    });

    // If no patient record is linked to this user account
    if (!patient) {
      res
        .status(404)
        .json({ message: "Patient profile not found for this user." });
      return;
    }

    // Now, fetch tests using the correct patient_id
    const testInstances = await prisma.testInstance.findMany({
      where: {
        patient_id: patient.patient_id, // Use the correct patient_id from the found record
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

export const submitTest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const testInstanceId = parseInt(req.params.id);
    const user = req.user;
    const { patientResponse } = req.body;

    if (isNaN(testInstanceId)) {
      res.status(400).json({ message: "Invalid test instance ID" });
      return;
    }

    if (!user?.userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Find the test instance to ensure it exists and belongs to the patient
    const testInstance = await prisma.testInstance.findUnique({
      where: { test_instance_id: testInstanceId },
      include: {
        patient: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!testInstance) {
      res.status(404).json({ message: "Test instance not found" });
      return;
    }

    // Security check: ensure the test belongs to the logged-in patient
    if (testInstance.patient?.user_id !== user.userId) {
      res
        .status(403)
        .json({ message: "You are not authorized to submit this test." });
      return;
    }

    // Update the test instance with the responses and stop date
    const updatedTest = await prisma.testInstance.update({
      where: { test_instance_id: testInstanceId },
      data: {
        patientResponse: patientResponse,
        testStopDate: new Date(),
      },
    });

    res.status(200).json({
      message: "Test submitted successfully",
      test: updatedTest,
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    res.status(500).json({ message: "Failed to submit test" });
  }
};

// Get all completed tests (admin only)
export const getAllCompletedTests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const completedTests = await prisma.testInstance.findMany({
      where: {
        testStopDate: {
          not: null, // Only tests that have been completed
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
        testStopDate: "desc",
      },
    });

    res.json(completedTests);
  } catch (error) {
    console.error("Error fetching all completed tests:", error);
    res.status(500).json({ message: "Failed to fetch completed tests" });
  }
};
