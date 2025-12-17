import { NextResponse } from "next/server";
import DoctorModel from "@/db/models/Doctor";
import DoctorScheduleModel from "@/db/models/DoctorScheduleModel";
import User from "@/db/models/User";
import { Doctor } from "@/types/docterTypes";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    const { _id: doctorId } = await params;
    console.log("[api/doctor/:_id] incoming request", { doctorId });

    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    const doctor = await DoctorModel.getDoctorById(doctorId);

    if (!doctor) {
      console.log("[api/doctor/:_id] doctor not found", { doctorId });
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    console.log("[api/doctor/:_id] doctor found", {
      doctorId: doctor._id?.toString?.() || doctorId,
    });
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
    const { name, specialization, clinic, image, isActive } = body;

    const updateData: Partial<Doctor> = {};
    if (name !== undefined) updateData.name = name;
    if (specialization !== undefined)
      updateData.specialization = specialization;
    if (clinic !== undefined) updateData.clinic = clinic;
    if (image !== undefined) updateData.image = image;
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

    // Get doctor first to find the associated userId
    const doctor = await DoctorModel.getDoctorById(doctorId);

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Delete the doctor's schedule if exists
    try {
      const schedule = await DoctorScheduleModel.getScheduleByDoctorId(
        doctorId
      );
      if (schedule && schedule._id) {
        await DoctorScheduleModel.delete(schedule._id.toString());
        console.log("Associated schedule deleted:", schedule._id.toString());
      }
    } catch (scheduleDeleteError) {
      console.error(
        "Failed to delete associated schedule:",
        scheduleDeleteError
      );
      // Continue anyway - we still want to delete the doctor
    }

    // Delete the doctor
    await DoctorModel.delete(doctorId);

    // Delete the associated user if userId exists
    if (doctor.userId) {
      try {
        await User.findByIdAndDelete(doctor.userId.toString());
        console.log("Associated user deleted:", doctor.userId.toString());
      } catch (userDeleteError) {
        console.error("Failed to delete associated user:", userDeleteError);
        // Continue anyway - doctor is already deleted
      }
    }

    return NextResponse.json(
      { message: "Doctor, schedule, and associated user deleted successfully" },
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
