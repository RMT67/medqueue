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

    // 1. get data schedules from doctorschedules collection by doctorId
    const schedules = (await ScheduleModel.getByDoctorId(
      body.doctorId.toString()
    )) as DoctorScheduleType;

    if (!schedules) {
      return NextResponse.json(
        { message: "Doctor schedule not found" },
        { status: 404 }
      );
    }

    // 2. Validate if doctor is available on the selected day
    const selectedDate = new Date(body.scheduleDate);
    const dayOfWeekIndex = selectedDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    const dayOfWeekMap: { [key: number]: string } = {
      0: "Minggu",
      1: "Senin",
      2: "Selasa",
      3: "Rabu",
      4: "Kamis",
      5: "Jumat",
      6: "Sabtu",
    };
    const selectedDayOfWeek = dayOfWeekMap[dayOfWeekIndex];

    const daySchedule = schedules.dayOfWeek.find(
      (day) => day.hari === selectedDayOfWeek
    );

    if (!daySchedule || !daySchedule.availabel) {
      return NextResponse.json(
        { message: `Doctor is not available on ${selectedDayOfWeek}` },
        { status: 400 }
      );
    }

    // 3. get data average time per patient => from doctors collection, default 15 minutes
    const doctor = (await DoctorModel.getDoctorById(
      body.doctorId.toString()
    )) as Doctor;

    if (!doctor) {
      return NextResponse.json(
        { message: "Doctor not found" },
        { status: 404 }
      );
    }

    const averageTimePerPatient = doctor?.averageTimePerPatient || 15;

    // 4. get currentPatient = count of CONFIRMED/PENDING bookings for that doctor ON THAT DATE
    const allBookingsForDoctor = await Booking.findByDoctorId(
      body.doctorId.toString()
    );

    // Filter bookings: same date AND not cancelled
    const bookingsOnDate = allBookingsForDoctor.filter((booking) => {
      const bookingDate = new Date(booking.scheduleDate);
      const isSameDate =
        bookingDate.getFullYear() === selectedDate.getFullYear() &&
        bookingDate.getMonth() === selectedDate.getMonth() &&
        bookingDate.getDate() === selectedDate.getDate();
      const isNotCancelled = booking.status !== "cancelled";
      return isSameDate && isNotCancelled;
    });

    const currentPatient = bookingsOnDate.length;

    // 5. get maxPatient from schedule
    const maxPatient = schedules.maxPatients;

    // 6. if currentPatient >= maxPatient, return error
    if (currentPatient >= maxPatient) {
      return NextResponse.json(
        {
          message:
            "No available queue for this date. Maximum patients reached.",
        },
        { status: 400 }
      );
    }

    // 7. Create booking
    const booking = await Booking.create(
      {
        patientId: body.patientId,
        doctorId: body.doctorId,
        scheduleDate: new Date(body.scheduleDate),
        timeRange: body.timeRange,
        complaint: body.complaint,
      },
      averageTimePerPatient,
      bookingsOnDate // pass existing bookings to avoid re-querying
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
