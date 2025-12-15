import { NextRequest, NextResponse } from "next/server";
import ServiceModel from "@/db/models/ServiceModel";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("id");
    const code = searchParams.get("code");
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("activeOnly");

    // Get service by ID
    if (serviceId) {
      const service = await ServiceModel.getServiceById(serviceId);

      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(service);
    }

    // Get service by code
    if (code) {
      const service = await ServiceModel.getServiceByCode(code);

      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(service);
    }

    // Get services by category
    if (category) {
      const services = await ServiceModel.getServicesByCategory(category);
      return NextResponse.json(services);
    }

    // Get active services only
    if (activeOnly === "true") {
      const services = await ServiceModel.getActiveServices();
      return NextResponse.json(services);
    }

    // Get all services
    const services = await ServiceModel.getAllServices();
    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "code",
      "name",
      "category",
      "price",
      "currency",
      "duration",
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if service code already exists
    const existingService = await ServiceModel.getServiceByCode(body.code);
    if (existingService) {
      return NextResponse.json(
        { error: "Service code already exists" },
        { status: 409 }
      );
    }

    const service = await ServiceModel.create(body);

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, ...serviceData } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Check if service exists
    const existingService = await ServiceModel.getServiceById(_id);
    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // If updating code, check if new code already exists
    if (serviceData.code && serviceData.code !== existingService.code) {
      const codeExists = await ServiceModel.getServiceByCode(serviceData.code);
      if (codeExists) {
        return NextResponse.json(
          { error: "Service code already exists" },
          { status: 409 }
        );
      }
    }

    const updatedService = await ServiceModel.update(_id, serviceData);

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("id");

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Check if service exists
    const existingService = await ServiceModel.getServiceById(serviceId);
    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await ServiceModel.delete(serviceId);

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("id");
    const action = searchParams.get("action");

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Check if service exists
    const existingService = await ServiceModel.getServiceById(serviceId);
    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    let updatedService;

    if (action === "deactivate") {
      updatedService = await ServiceModel.deactivate(serviceId);
    } else if (action === "activate") {
      updatedService = await ServiceModel.activate(serviceId);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'activate' or 'deactivate'" },
        { status: 400 }
      );
    }

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("Error updating service status:", error);
    return NextResponse.json(
      { error: "Failed to update service status" },
      { status: 500 }
    );
  }
}
