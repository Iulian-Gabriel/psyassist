import { Request, Response } from "express";
import prisma from "../utils/prisma";

// Get all active service types
export const getAllServiceTypes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const serviceTypes = await prisma.serviceType.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    res.json(serviceTypes);
  } catch (error) {
    console.error("Error fetching service types:", error);
    res.status(500).json({ message: "Failed to fetch service types" });
  }
};

// Create a new service type
export const createServiceType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, duration_minutes } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: "Service type name is required" });
      return;
    }

    // Check if service type already exists
    const existingType = await prisma.serviceType.findFirst({
      where: { name },
    });

    if (existingType) {
      res.status(409).json({ message: "Service type already exists" });
      return;
    }

    // Create new service type
    const serviceType = await prisma.serviceType.create({
      data: {
        name,
        description: description || null,
        duration_minutes: duration_minutes || 60,
        active: true,
      },
    });

    res.status(201).json({
      message: "Service type created successfully",
      serviceType,
    });
  } catch (error) {
    console.error("Error creating service type:", error);
    res.status(500).json({ message: "Failed to create service type" });
  }
};

// Get a service type by ID
export const getServiceTypeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const typeId = parseInt(req.params.id, 10);

    if (isNaN(typeId)) {
      res.status(400).json({ message: "Invalid service type ID" });
      return;
    }

    const serviceType = await prisma.serviceType.findUnique({
      where: { service_type_id: typeId },
    });

    if (!serviceType) {
      res.status(404).json({ message: "Service type not found" });
      return;
    }

    res.json(serviceType);
  } catch (error) {
    console.error("Error fetching service type:", error);
    res.status(500).json({ message: "Failed to fetch service type" });
  }
};

// Update a service type
export const updateServiceType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const typeId = parseInt(req.params.id, 10);
    const { name, description, duration_minutes, active } = req.body;

    if (isNaN(typeId)) {
      res.status(400).json({ message: "Invalid service type ID" });
      return;
    }

    // Update service type
    const serviceType = await prisma.serviceType.update({
      where: { service_type_id: typeId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        duration_minutes: duration_minutes || undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    res.json({
      message: "Service type updated successfully",
      serviceType,
    });
  } catch (error) {
    console.error("Error updating service type:", error);
    res.status(500).json({ message: "Failed to update service type" });
  }
};

// Delete a service type (soft delete by setting active = false)
export const deleteServiceType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const typeId = parseInt(req.params.id, 10);

    if (isNaN(typeId)) {
      res.status(400).json({ message: "Invalid service type ID" });
      return;
    }

    // Soft delete by setting active = false
    const serviceType = await prisma.serviceType.update({
      where: { service_type_id: typeId },
      data: { active: false },
    });

    res.json({
      message: "Service type deleted successfully",
      serviceType,
    });
  } catch (error) {
    console.error("Error deleting service type:", error);
    res.status(500).json({ message: "Failed to delete service type" });
  }
};
