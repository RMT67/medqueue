import { NextRequest, NextResponse } from "next/server";
import ServiceModel from "@/db/models/Service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");
    const category = searchParams.get("category");

    let services;

    if (isActive === "true") {
      services = await ServiceModel.getActiveServices();
    } else if (category) {
      services = await ServiceModel.getServicesByCategory(category);
    } else {
      services = await ServiceModel.getAllServices();
    }

    return NextResponse.json(
      {
        success: true,
        data: services,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch services",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newService = await ServiceModel.create(body);
    return NextResponse.json(
      { success: true, data: newService },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create service" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { serviceId, ...updateData } = body;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    const updatedService = await ServiceModel.update(serviceId, updateData);
    return NextResponse.json(
      { success: true, data: updatedService },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    await ServiceModel.delete(serviceId);
    return NextResponse.json(
      { success: true, message: "Service deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
