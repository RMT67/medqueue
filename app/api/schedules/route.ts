import { NextRequest, NextResponse } from "next/server";
import DoctorScheduleModel from "@/db/models/DoctorScheduleModel";
import { DoctorWithSchedule, DaySchedule } from "@/types/scheduleTypes";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const day = searchParams.get("day");

    if (doctorId) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const schedule = await DoctorScheduleModel.create(body);

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { _id, ...scheduleData } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      );
    }

    const updatedSchedule = await DoctorScheduleModel.update(_id, scheduleData);

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
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

    await DoctorScheduleModel.delete(scheduleId);

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
