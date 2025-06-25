import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

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
    });

    const forms = testTemplates.map((template) => {
      // This logic will now work correctly for all records
      const templateData = template.template_questions as {
        description?: string;
      } | null;

      return {
        form_id: template.test_template_id,
        title: template.name || "Untitled Form",
        description: templateData?.description || null,
        created_at: new Date().toISOString(), // This seems to be placeholder, consider using actual creation date
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
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    const validatedData = CreateTestFormSchema.parse(req.body);

    const template = await prisma.testTemplate.create({
      data: {
        name: validatedData.name,
        isActive: true,
        isExternal: validatedData.isExternal || false,
        // --- FIX: Pass a proper JSON object, not a string ---
        template_questions: validatedData.description
          ? { description: validatedData.description }
          : undefined,
        testTemplateVersions: {
          create: {
            version: 1,
            questionsJson: validatedData.questions as any,
          },
        },
      },
      include: {
        testTemplateVersions: true,
      },
    });

    const templateData = template.template_questions as {
      description?: string;
    } | null;

    res.status(201).json({
      form: {
        form_id: template.test_template_id,
        title: template.name,
        description: templateData?.description || null,
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

    const template = await prisma.testTemplate.findUnique({
      where: {
        test_template_id: formId,
        isActive: true,
      },
      include: {
        testTemplateVersions: {
          orderBy: { version: "desc" },
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
    const questions = latestVersion?.questionsJson || [];
    const responses =
      latestVersion?.testInstances.map((instance) => ({
        responseId: String(instance.test_instance_id),
        patientId: instance.patient_id?.toString() || "unknown",
        patientName: `${instance.patient?.user.first_name} ${instance.patient?.user.last_name}`,
        timestamp: instance.testStopDate || instance.testStartDate,
        answers: instance.patientResponse || {},
      })) || [];

    const templateData = template.template_questions as {
      description?: string;
    } | null;

    res.json({
      form: {
        form_id: template.test_template_id,
        title: template.name || "Untitled Form",
        description: templateData?.description || null,
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
    const userId = req.user?.userId;
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

    const existingTemplate = await prisma.testTemplate.findUnique({
      where: { test_template_id: formId, isActive: true },
      include: {
        testTemplateVersions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!existingTemplate) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    const latestVersion =
      existingTemplate.testTemplateVersions[0]?.version || 0;
    const newVersionNumber = latestVersion + 1;

    const dataToUpdate: {
      name: string;
      isExternal: boolean;
      template_questions?: { description: string };
    } = {
      name: validatedData.name,
      isExternal: validatedData.isExternal,
    };

    // --- FIX: Pass a proper JSON object, not a string ---
    if (validatedData.description) {
      dataToUpdate.template_questions = {
        description: validatedData.description,
      };
    }

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      const template = await tx.testTemplate.update({
        where: { test_template_id: formId },
        data: dataToUpdate,
      });

      const newVersion = await tx.testTemplateVersion.create({
        data: {
          test_template_id: formId,
          version: newVersionNumber,
          questionsJson: validatedData.questions as any,
        },
      });

      return { template, newVersion };
    });

    const templateData = updatedTemplate.template.template_questions as {
      description?: string;
    } | null;

    res.json({
      form: {
        form_id: updatedTemplate.template.test_template_id,
        title: updatedTemplate.template.name,
        description: templateData?.description || null,
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
  try {
    const formId = parseInt(req.params.id);
    if (isNaN(formId)) {
      res.status(400).json({ message: "Invalid form ID" });
      return;
    }

    const form = await prisma.testTemplate.findUnique({
      where: {
        test_template_id: formId,
        isActive: true,
      },
      include: {
        testTemplateVersions: {
          orderBy: { version: "desc" },
          include: { _count: { select: { testInstances: true } } },
        },
      },
    });

    if (!form) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    const templateData = form.template_questions as {
      description?: string;
    } | null;

    res.json({
      form: {
        form_id: form.test_template_id,
        title: form.name || "Untitled Form",
        description: templateData?.description || null,
        isActive: form.isActive,
      },
      versions: form.testTemplateVersions.map((v) => ({
        version_id: v.test_template_version_ID,
        version: v.version,
        created_at: v.created_at,
        responseCount: v._count.testInstances,
      })),
    });
  } catch (error) {
    console.error("Error fetching form versions:", error);
    res.status(500).json({ message: "Failed to fetch form versions" });
  }
};
