import { NextResponse } from "next/server";
import DoctorModel from "@/db/models/Doctor";

export async function GET() {
  try {
    const doctors = await DoctorModel.getAllDoctors();
    return NextResponse.json({ doctors }, { status: 200 });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newDoctor = await DoctorModel.create(body);
    return NextResponse.json({ doctor: newDoctor }, { status: 201 });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updatedDoctor = await DoctorModel.update(
      body.doctorId,
      body.updateData
    );
    return NextResponse.json({ doctor: updatedDoctor }, { status: 200 });
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
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
