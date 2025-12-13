import { NextResponse } from "next/server";
import DoctorModel from "@/db/models/Doctor";
import { Doctor } from "@/types/docterTypes";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    const { _id: doctorId } = await params;

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    const doctor = await DoctorModel.getDoctorById(doctorId);

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ doctor }, { status: 200 });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    const { _id: doctorId } = await params;

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, specialization, clinic, image, consultationFee, isActive } =
      body;

    const updateData: Partial<Doctor> = {};
    if (name !== undefined) updateData.name = name;
    if (specialization !== undefined)
      updateData.specialization = specialization;
    if (clinic !== undefined) updateData.clinic = clinic;
    if (image !== undefined) updateData.image = image;
    if (consultationFee !== undefined)
      updateData.consultationFee = consultationFee;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDoctor = await DoctorModel.update(doctorId, updateData);

    if (!updatedDoctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Doctor updated successfully", doctor: updatedDoctor },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { _id: string } }
) {
  try {
    const { _id: doctorId } = await params;

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    await DoctorModel.delete(doctorId);

    return NextResponse.json(
      { message: "Doctor deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { error: "Failed to delete doctor" },
      { status: 500 }
    );
  }
}
