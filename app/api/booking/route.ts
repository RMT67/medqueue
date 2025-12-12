// create logic for booking an appointment
import { NextResponse } from "next/server";
import Booking from "@/db/models/Booking";

interface BookingBody {
  patientId: string;
  doctorId: string;
  scheduledDate: Date;
  timeRange: string;
  complaint: string;
  cancelReason?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  queueId?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BookingBody;

    await Booking.create({
      patientId: body.patientId,
      doctorId: body.doctorId,
      scheduledDate: body.scheduledDate,
      timeRange: body.timeRange,
      complaint: body.complaint,
    });

    // const patientId = "dummy-patient-id";
    // const {
    //   doctorId,
    //   scheduledDate,
    //   timeRange,
    //   complaint,
    //   queueId,
    //   cancelReason,
    //   notes,
    //   createdAt,
    //   updatedAt,
    //   status,
    // } = body;
    return;
  } catch (error) {
    console.log("Error creating booking:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
