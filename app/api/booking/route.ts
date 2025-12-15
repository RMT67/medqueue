// create logic for booking an appointment
import { NextResponse } from "next/server";
import Booking from "@/db/models/Booking";
import { BookingType } from "@/types/bookingType";
import ScheduleModel from "@/db/models/Schedule";
import DoctorModel from "@/db/models/Doctor";
import { DoctorScheduleType } from "@/types/doctorScheduleType";
import { Doctor } from "@/types/docterTypes";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BookingType;

    // firstly validate the queue of the doctor on that date and timeRange
    // 1. get data schedules from doctorschedules collection by doctorId
    const schedules = (await ScheduleModel.getByDoctorId(
      body.doctorId.toString()
    )) as DoctorScheduleType;
    // 2. get data avaerage time per patient => this data should be in doctors colection, if averageTimePerPatient in data is null, set default 15 minutes
    const doctor = (await DoctorModel.getDoctorById(
      body.doctorId.toString()
    )) as Doctor;
    const averageTimePerPatient = doctor?.averageTimePerPatient || 15;
    // 3. get data currentPatient => this data should be in doctorschedules collection
    const currentPatient = schedules?.currentPatients || 0;
    // 4. calculate maxPatient = timeRange / averageTimePerPatient
    const timeRangeParts = schedules.timeRange.split("-");
    // sample data time range "08:30-12:00"
    const startTimeParts = timeRangeParts[0].split(":");
    const endTimeParts = timeRangeParts[1].split(":");
    const startTime =
      parseInt(startTimeParts[0], 10) + parseInt(startTimeParts[1], 10) / 60;
    const endTime =
      parseInt(endTimeParts[0], 10) + parseInt(endTimeParts[1], 10) / 60;
    const totalHours = endTime - startTime;
    const maxPatient = Math.floor((totalHours * 60) / averageTimePerPatient);
    // 5. if currentPatient >= maxPatient, return error "No available queue for this time range"
    if (currentPatient >= maxPatient) {
      return NextResponse.json(
        { message: "No available queue for this time range" },
        { status: 400 }
      );
    }

    const booking = await Booking.create(
      {
        patientId: body.patientId,
        doctorId: body.doctorId,
        scheduleDate: new Date(body.scheduleDate),
        timeRange: body.timeRange,
        complaint: body.complaint,
      },
      averageTimePerPatient
    );
    return NextResponse.json(
      {
        message: "Booking created successfully",
        bookingNumber: booking.bookingNumber,
        queueNumber: booking.queueNumber,
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
