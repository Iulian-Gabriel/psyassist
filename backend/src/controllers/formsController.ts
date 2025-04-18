import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { config } from "../config/env"; // Add this import

// Schema for creating a form/test template
const CreateTestFormSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  isExternal: z.boolean().default(false),
  questions: z
    .array(
      z.object({
        question: z.string().min(3),
        type: z.enum(["TEXT", "MULTIPLE_CHOICE", "SCALE"]),
        required: z.boolean().default(true),
        options: z.array(z.string()).optional(),
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
      })
    )
    .min(1),
});

export const getAllForms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const testTemplates = await prisma.testTemplate.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        test_template_id: "desc",
      },
      include: {
        testTemplateVersions: {
          take: 1,
          orderBy: {
            version: "desc",
          },
        },
      },
    });

    const forms = testTemplates.map((template) => {
      // Parse the JSON and extract just the description
      let description = null;
      if (template.template_questions) {
        try {
          const parsedData = JSON.parse(String(template.template_questions));
          description = parsedData.description;
        } catch (e) {
          console.error("Error parsing template_questions:", e);
        }
      }

      return {
        form_id: template.test_template_id,
        title: template.name || "Untitled Form",
        description: description,
        created_at: new Date().toISOString(),
        user: {
          first_name: "System",
          last_name: "User",
        },
        responseCount: 0,
      };
    });

    res.json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ message: "Failed to fetch psychological forms" });
  }
};

export const createForm = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const validatedData = CreateTestFormSchema.parse(req.body);

    // Create test template
    const template = await prisma.testTemplate.create({
      data: {
        name: validatedData.name,
        isActive: true,
        isExternal: validatedData.isExternal || false,
        // Fix: Convert to Prisma JSON type
        template_questions: validatedData.description
          ? (JSON.stringify({ description: validatedData.description }) as any) // Cast as any to bypass type checking
          : undefined, // Use undefined instead of null
        testTemplateVersions: {
          create: {
            version: 1,
            // This is the cleaner way to store JSON data
            questionsJson: validatedData.questions as any,
          },
        },
      },
      include: {
        testTemplateVersions: true,
      },
    });

    res.status(201).json({
      form: {
        form_id: template.test_template_id,
        title: template.name,
        // Parse the JSON back to extract the description
        description: template.template_questions
          ? JSON.parse(String(template.template_questions)).description
          : null,
        created_at: template.testTemplateVersions[0]?.created_at,
        version: template.testTemplateVersions[0]?.version || 1,
      },
    });
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({ message: "Failed to create psychological form" });
  }
};

export const getFormResponses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const formId = parseInt(req.params.id);
    if (isNaN(formId)) {
      res.status(400).json({ message: "Invalid form ID" });
      return;
    }

    // Get the form with its responses
    const template = await prisma.testTemplate.findUnique({
      where: {
        test_template_id: formId,
        isActive: true,
      },
      include: {
        testTemplateVersions: {
          orderBy: {
            version: "desc",
          },
          take: 1,
          include: {
            testInstances: {
              include: {
                patient: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!template) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    const latestVersion = template.testTemplateVersions[0];

    // ✨ CHANGE THIS PART ✨
    // No need to parse, Prisma already returns it as an object
    // Check if it exists and provide a default empty array
    const questions = latestVersion?.questionsJson || [];

    // Transform responses into a more frontend-friendly format
    const responses =
      latestVersion?.testInstances.map((instance) => ({
        responseId: String(instance.test_instance_id),
        patientId: instance.patient_id?.toString() || "unknown",
        patientName: `${instance.patient?.user.first_name} ${instance.patient?.user.last_name}`,
        timestamp: instance.testStopDate || instance.testStartDate,
        answers: instance.patientResponse || {},
      })) || [];

    // ✨ ALSO FIX THIS PART ✨
    // Handle template_questions as a JSON object, not a string
    let description = null;
    if (template.template_questions) {
      try {
        // Check if it's a string that needs parsing or already an object
        if (typeof template.template_questions === "string") {
          const parsedData = JSON.parse(template.template_questions);
          description = parsedData?.description || null;
        } else {
          // It's already an object, but we need to type check it first
          const jsonObj = template.template_questions as Record<
            string,
            unknown
          >;
          description = "description" in jsonObj ? jsonObj.description : null;
        }
      } catch (e) {
        console.error("Error handling template_questions:", e);
      }
    }

    // Send the response back to the client
    res.json({
      form: {
        form_id: template.test_template_id,
        title: template.name || "Untitled Form",
        description: description,
        created_at: latestVersion?.created_at || new Date(),
        user: {
          first_name: "System",
          last_name: "User",
        },
      },
      questions,
      responses,
    });
  } catch (error) {
    console.error("Error fetching form details:", error);
    res.status(500).json({ message: "Failed to fetch form details" });
  }
};

export const updateForm = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const formId = parseInt(req.params.id);
    if (isNaN(formId)) {
      res.status(400).json({ message: "Invalid form ID" });
      return;
    }

    const validatedData = CreateTestFormSchema.parse(req.body);

    // First, check if the form exists and get the latest version
    const existingTemplate = await prisma.testTemplate.findUnique({
      where: {
        test_template_id: formId,
        isActive: true,
      },
      include: {
        testTemplateVersions: {
          orderBy: {
            version: "desc",
          },
          take: 1,
        },
      },
    });

    if (!existingTemplate) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    // Calculate the next version number
    const latestVersion =
      existingTemplate.testTemplateVersions[0]?.version || 0;
    const newVersionNumber = latestVersion + 1;

    // Update basic template info and create a new version
    const updatedTemplate = await prisma.$transaction(async (tx) => {
      // Update the template
      const template = await tx.testTemplate.update({
        where: { test_template_id: formId },
        data: {
          name: validatedData.name,
          template_questions: validatedData.description
            ? (JSON.stringify({
                description: validatedData.description,
              }) as any)
            : undefined,
          isExternal: validatedData.isExternal,
        },
      });

      // Create a new version
      const newVersion = await tx.testTemplateVersion.create({
        data: {
          test_template_id: formId,
          version: newVersionNumber,
          questionsJson: validatedData.questions as any,
        },
      });

      return { template, newVersion };
    });

    // Extract description
    let description = null;
    if (updatedTemplate.template.template_questions) {
      try {
        if (typeof updatedTemplate.template.template_questions === "string") {
          const parsedData = JSON.parse(
            String(updatedTemplate.template.template_questions)
          );
          description = parsedData.description;
        } else {
          const templateQuestions = updatedTemplate.template
            .template_questions as any;
          description = templateQuestions.description;
        }
      } catch (e) {
        console.error("Error parsing template_questions:", e);
      }
    }

    res.json({
      form: {
        form_id: updatedTemplate.template.test_template_id,
        title: updatedTemplate.template.name,
        description: description,
        version: updatedTemplate.newVersion.version,
        created_at: updatedTemplate.newVersion.created_at,
      },
    });
  } catch (error) {
    console.error("Error updating form:", error);
    res.status(500).json({ message: "Failed to update psychological form" });
  }
};

export const getFormVersions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  // Change return type to Promise<void>
  try {
    const formId = parseInt(req.params.id);
    if (isNaN(formId)) {
      res.status(400).json({ message: "Invalid form ID" });
      return; // Just return, don't return the response
    }

    const form = await prisma.testTemplate.findUnique({
      where: {
        test_template_id: formId,
        isActive: true,
      },
      include: {
        testTemplateVersions: {
          orderBy: {
            version: "desc",
          },
          include: {
            _count: {
              select: {
                testInstances: true,
              },
            },
          },
        },
      },
    });

    if (!form) {
      res.status(404).json({ message: "Form not found" });
      return; // Just return, don't return the response
    }

    // Extract description from template_questions
    let description = null;
    if (form.template_questions) {
      try {
        const parsedData = JSON.parse(form.template_questions.toString());
        description = parsedData.description;
      } catch (e) {
        console.error("Error parsing template_questions:", e);
      }
    }

    res.json({
      form: {
        form_id: form.test_template_id,
        title: form.name || "Untitled Form",
        description: description,
        isActive: form.isActive,
      },
      versions: form.testTemplateVersions.map((v) => ({
        version_id: v.test_template_version_ID,
        version: v.version,
        created_at: v.created_at,
        responseCount: v._count.testInstances,
      })),
    });
    // No return statement needed here
  } catch (error) {
    console.error("Error fetching form versions:", error);
    res.status(500).json({ message: "Failed to fetch form versions" });
    // No return statement needed here
  }
};
