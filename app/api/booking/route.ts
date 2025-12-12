// create logic for booking an appointment
import { NextResponse } from "next/server";
import Booking from "@/db/models/Booking";
import { BookingType } from "@/types/bookingType";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BookingType;

    const booking = await Booking.create({
      patientId: body.patientId,
      doctorId: body.doctorId,
      scheduleDate: new Date(body.scheduleDate),
      timeRange: body.timeRange,
      complaint: body.complaint,
    });
    return NextResponse.json(
      {
        message: "Booking created successfully",
        bookingNumber: booking.bookingNumber,
        queueNumber: booking.queueId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error creating booking:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
