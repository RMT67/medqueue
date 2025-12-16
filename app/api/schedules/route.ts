import { NextRequest, NextResponse } from "next/server";
import DoctorScheduleModel from "@/db/models/DoctorScheduleModel";
import DoctorModel from "@/db/models/Doctor";
import { DoctorWithSchedule, DaySchedule } from "@/types/scheduleTypes";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const day = searchParams.get("day");

    if (doctorId) {
      // Validate ObjectId format
      if (!ObjectId.isValid(doctorId)) {
        return NextResponse.json(
          { error: "Invalid doctor ID format" },
          { status: 400 }
        );
      }

      const schedule = await DoctorScheduleModel.getScheduleByDoctorId(
        doctorId
      );

      if (!schedule) {
        return NextResponse.json(
          { error: "Schedule not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(schedule);
    }

    // Get all schedules with doctor info
    const schedulesWithDoctorInfo: DoctorWithSchedule[] =
      await DoctorScheduleModel.getSchedulesWithDoctorInfo();

    // Filter by day if provided
    if (day) {
      const filteredSchedules = schedulesWithDoctorInfo.filter((schedule) => {
        return schedule.dayOfWeek.some(
          (daySchedule: DaySchedule) =>
            daySchedule.hari === day && daySchedule.available
        );
      });
      return NextResponse.json(filteredSchedules);
    }

    return NextResponse.json(schedulesWithDoctorInfo);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// Helper function to calculate isOnTime based on delayMinutes
function calculateIsOnTime(delayMinutes: number): boolean {
  // If delay is 5 minutes or less, consider it on time
  return delayMinutes <= 5;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { doctorId, dayOfWeek, maxPatients, isAvailable, firstCallTime, delayMinutes } = body;

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

    // Check if doctor exists
    const doctor = await DoctorModel.getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Check if schedule already exists for this doctor
    const existingSchedule = await DoctorScheduleModel.getScheduleByDoctorId(doctorId);
    if (existingSchedule) {
      return NextResponse.json(
        { error: "Schedule already exists for this doctor. Please update the existing schedule instead." },
        { status: 409 }
      );
    }

    // Validate dayOfWeek
    if (!dayOfWeek || !Array.isArray(dayOfWeek) || dayOfWeek.length === 0) {
      return NextResponse.json(
        { error: "At least one day must be available" },
        { status: 400 }
      );
    }

    // Validate at least one day is available
    const availableDays = dayOfWeek.filter((day: DaySchedule) => day.available);
    if (availableDays.length === 0) {
      return NextResponse.json(
        { error: "At least one day must be marked as available" },
        { status: 400 }
      );
    }

    // Validate time ranges for available days
    for (const day of availableDays) {
      if (!day.startTime || !day.endTime) {
        return NextResponse.json(
          { error: `Start time and end time are required for ${day.hari}` },
          { status: 400 }
        );
      }

      if (day.startTime >= day.endTime) {
        return NextResponse.json(
          { error: `Start time must be before end time for ${day.hari}` },
          { status: 400 }
        );
      }
    }

    // Validate maxPatients
    if (maxPatients !== undefined && (maxPatients < 1 || maxPatients > 100)) {
      return NextResponse.json(
        { error: "Max patients must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Calculate isOnTime based on delayMinutes
    const calculatedDelayMinutes = delayMinutes || 0;
    const calculatedIsOnTime = calculateIsOnTime(calculatedDelayMinutes);

    const schedule = await DoctorScheduleModel.create({
      doctorId,
      dayOfWeek,
      isAvailable: isAvailable ?? true,
      firstCallTime: firstCallTime || null,
      isOnTime: calculatedIsOnTime, // Calculated automatically
      delayMinutes: calculatedDelayMinutes,
      maxPatients: maxPatients || 20,
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error("Error creating schedule:", error);
    
    // Handle duplicate key error (if MongoDB unique index exists)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Schedule already exists for this doctor" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, doctorId, dayOfWeek, maxPatients, isAvailable, firstCallTime, delayMinutes } = body;

    // Validation: _id is required
    if (!_id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(_id)) {
      return NextResponse.json(
        { error: "Invalid schedule ID format" },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const collection = await DoctorScheduleModel.collection();
    const scheduleById = await collection.findOne({ _id: new ObjectId(_id) });
    
    if (!scheduleById) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Validate dayOfWeek if provided
    if (dayOfWeek && Array.isArray(dayOfWeek)) {
      const availableDays = dayOfWeek.filter((day: DaySchedule) => day.available);
      
      if (availableDays.length === 0) {
        return NextResponse.json(
          { error: "At least one day must be marked as available" },
          { status: 400 }
        );
      }

      // Validate time ranges for available days
      for (const day of availableDays) {
        if (!day.startTime || !day.endTime) {
          return NextResponse.json(
            { error: `Start time and end time are required for ${day.hari}` },
            { status: 400 }
          );
        }

        if (day.startTime >= day.endTime) {
          return NextResponse.json(
            { error: `Start time must be before end time for ${day.hari}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate maxPatients if provided
    if (maxPatients !== undefined && (maxPatients < 1 || maxPatients > 100)) {
      return NextResponse.json(
        { error: "Max patients must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {};
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (firstCallTime !== undefined) updateData.firstCallTime = firstCallTime || null;
    if (maxPatients !== undefined) updateData.maxPatients = maxPatients;
    if (doctorId) updateData.doctorId = doctorId;
    
    // Calculate isOnTime automatically if delayMinutes is provided
    if (delayMinutes !== undefined) {
      updateData.delayMinutes = delayMinutes;
      updateData.isOnTime = calculateIsOnTime(delayMinutes);
    } else {
      // If delayMinutes not provided but we need to recalculate, get current delayMinutes
      const currentSchedule = await collection.findOne({ _id: new ObjectId(_id) });
      if (currentSchedule) {
        const currentDelay = currentSchedule.delayMinutes || 0;
        updateData.isOnTime = calculateIsOnTime(currentDelay);
      }
    }

    const updatedSchedule = await DoctorScheduleModel.update(_id, updateData);

    return NextResponse.json(updatedSchedule);
  } catch (error: any) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(scheduleId)) {
      return NextResponse.json(
        { error: "Invalid schedule ID format" },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const collection = await DoctorScheduleModel.collection();
    const schedule = await collection.findOne({ _id: new ObjectId(scheduleId) });
    
    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    await DoctorScheduleModel.delete(scheduleId);

    return NextResponse.json({ 
      message: "Schedule deleted successfully",
      deletedId: scheduleId 
    });
  } catch (error: any) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
