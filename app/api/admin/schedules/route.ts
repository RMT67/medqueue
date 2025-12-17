import { NextRequest, NextResponse } from "next/server";
import DoctorScheduleModel from "@/db/models/DoctorScheduleModel";
import DoctorModel from "@/db/models/Doctor";
import { ObjectId } from "mongodb";

// GET - Fetch all schedules with full doctor info for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // If specific schedule ID requested
    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid schedule ID format" },
          { status: 400 }
        );
      }

      const schedulesWithInfo =
        await DoctorScheduleModel.getSchedulesWithDoctorInfo();
      const schedule = schedulesWithInfo.find((s) => s._id.toString() === id);

      if (!schedule) {
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(schedule);
    }

    // Get all schedules with doctor info for admin dashboard
    const schedules = await DoctorScheduleModel.getSchedulesWithDoctorInfo();

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching admin schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST - Create new schedule (Admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      doctorId,
      dayOfWeek,
      maxPatients,
      isAvailable,
      firstCallTime,
      delayMinutes,
    } = body;

    // Validation: doctorId is required
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        { error: "Invalid doctor ID format" },
        { status: 400 }
      );
    }

    // Validate dayOfWeek
    if (!dayOfWeek || !Array.isArray(dayOfWeek) || dayOfWeek.length === 0) {
      return NextResponse.json(
        { error: "At least one day schedule is required" },
        { status: 400 }
      );
    }

    // Check if doctor exists
    const doctor = await DoctorModel.getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check if schedule already exists for this doctor
    const existingSchedule = await DoctorScheduleModel.getScheduleByDoctorId(
      doctorId
    );
    if (existingSchedule) {
      return NextResponse.json(
        { error: "Schedule already exists for this doctor" },
        { status: 409 }
      );
    }

    // Calculate isOnTime based on delayMinutes
    const isOnTime = (delayMinutes || 0) <= 5;

    // Create new schedule
    const newSchedule = await DoctorScheduleModel.create({
      doctorId,
      dayOfWeek,
      isAvailable: isAvailable ?? true,
      firstCallTime: firstCallTime || null,
      isOnTime,
      delayMinutes: delayMinutes || 0,
      maxPatients: maxPatients || 20,
    });

    return NextResponse.json(
      {
        message: "Schedule created successfully",
        data: newSchedule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create schedule",
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing schedule (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      _id,
      doctorId,
      dayOfWeek,
      maxPatients,
      isAvailable,
      firstCallTime,
      delayMinutes,
    } = body;

    // Validation
    if (!_id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(_id)) {
      return NextResponse.json(
        { error: "Invalid schedule ID format" },
        { status: 400 }
      );
    }

    // Validate dayOfWeek if provided
    if (dayOfWeek && (!Array.isArray(dayOfWeek) || dayOfWeek.length === 0)) {
      return NextResponse.json(
        { error: "At least one day schedule is required" },
        { status: 400 }
      );
    }

    // Calculate isOnTime based on delayMinutes
    const isOnTime = (delayMinutes || 0) <= 5;

    // Update schedule
    const updateData: Record<string, unknown> = {};
    if (doctorId !== undefined) updateData.doctorId = doctorId;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (maxPatients !== undefined) updateData.maxPatients = maxPatients;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (firstCallTime !== undefined) updateData.firstCallTime = firstCallTime;
    if (delayMinutes !== undefined) updateData.delayMinutes = delayMinutes;
    updateData.isOnTime = isOnTime;

    const updatedSchedule = await DoctorScheduleModel.update(_id, updateData);

    return NextResponse.json({
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update schedule",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete schedule (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid schedule ID format" },
        { status: 400 }
      );
    }

    const result = await DoctorScheduleModel.delete(id);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete schedule",
      },
      { status: 500 }
    );
  }
}
