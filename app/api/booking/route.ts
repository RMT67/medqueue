// create logic for booking an appointment
import { NextResponse } from "next/server";
import Booking from "@/db/models/Booking";
import { BookingType } from "@/types/bookingType";
import ScheduleModel from "@/db/models/Schedule";
import DoctorModel from "@/db/models/Doctor";
import { DoctorScheduleType } from "@/types/doctorScheduleType";
import { Doctor } from "@/types/docterTypes";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth-helper";
import { getDb } from "@/db/config/mongodb";

interface PatientData {
  _id: ObjectId;
  fullName: string;
  gender?: string;
  dateOfBirth?: Date;
}

export async function GET(req: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const populate = searchParams.get("populate");

    if (!doctorId) {
      return NextResponse.json(
        { success: false, message: "Doctor ID is required" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(doctorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Doctor ID format" },
        { status: 400 }
      );
    }

    // Authorization check: ensure requester is a doctor
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      try {
        const { userId, role } = verifyToken(authHeader);

        // If authenticated, verify it's a doctor
        if (role !== "doctor") {
          return NextResponse.json(
            { success: false, message: "Unauthorized: Doctor access only" },
            { status: 403 }
          );
        }

        // Verify the doctorId matches the authenticated doctor's doctorId
        const requestingDoctor = await DoctorModel.getDoctorByUserId(userId);
        if (
          !requestingDoctor ||
          requestingDoctor._id?.toString() !== doctorId
        ) {
          return NextResponse.json(
            {
              success: false,
              message: "Unauthorized: Can only access your own bookings",
            },
            { status: 403 }
          );
        }
      } catch (error) {
        console.log("🚀 ~ GET ~ error:", error);
        return NextResponse.json(
          { success: false, message: "Invalid authentication token" },
          { status: 401 }
        );
      }
    }

    // Fetch all bookings for this doctor
    const bookings = await Booking.findByDoctorId(doctorId);

    // If populate=patient, fetch patient data
    if (populate === "patient" && bookings.length > 0) {
      const db = await getDb();
      const usersCollection = db.collection<PatientData>("users");

      // Get unique patient IDs
      const patientIds = [
        ...new Set(bookings.map((b) => b.patientId.toString())),
      ];

      // Fetch all patients in one query
      const patients = await usersCollection
        .find(
          { _id: { $in: patientIds.map((id) => new ObjectId(id)) } },
          { projection: { fullName: 1, gender: 1, dateOfBirth: 1 } }
        )
        .toArray();

      // Create a map for quick lookup
      const patientMap = new Map(
        patients.map((p: PatientData) => [p._id.toString(), p])
      );

      // Attach patient data to bookings
      const bookingsWithPatients = bookings.map((booking) => {
        const patient = patientMap.get(booking.patientId.toString());
        return {
          ...booking,
          patient: patient
            ? {
                fullName: patient.fullName,
                gender: patient.gender,
                dateOfBirth: patient.dateOfBirth,
              }
            : null,
        };
      });

      return NextResponse.json(
        {
          success: true,
          data: bookingsWithPatients,
        },
        { status: 200 }
      );
    }

    // Return bookings without patient data (backward compatibility)
    return NextResponse.json(
      {
        success: true,
        data: bookings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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

    if (!daySchedule || !daySchedule.available) {
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

    // 4. get currentPatient = count of active bookings for that doctor ON THAT DATE
    // Active bookings = all status EXCEPT "cancelled"
    // Include: "pending", "confirmed", "completed" (completed still takes slot for that day)
    const allBookingsForDoctor = await Booking.findByDoctorId(
      body.doctorId.toString()
    );

    // Filter bookings: same date AND active (not cancelled)
    const bookingsOnDate = allBookingsForDoctor.filter((booking) => {
      const bookingDate = new Date(booking.scheduleDate);
      const isSameDate =
        bookingDate.getFullYear() === selectedDate.getFullYear() &&
        bookingDate.getMonth() === selectedDate.getMonth() &&
        bookingDate.getDate() === selectedDate.getDate();

      // Count all active bookings (exclude only cancelled)
      // "pending", "confirmed", "completed" all take a slot
      const isActiveBooking = booking.status !== "cancelled";

      return isSameDate && isActiveBooking;
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
        complaint: body.complaint,
      },
      averageTimePerPatient,
      bookingsOnDate, // pass existing bookings to avoid re-querying
      daySchedule, // pass the selected day schedule for startTime/endTime
      doctor.queueCode // pass doctor's queueCode, will fallback to Z if undefined
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

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { bookingId, status, actualDurationMinutes, consultationResult } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, message: "Booking ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // If status is cancelled, adjust appointment times for subsequent bookings
    if (status === "cancelled") {
      // Get booking to find doctor and get averageTimePerPatient
      const collection = await Booking.collection();
      const booking = await collection.findOne({ _id: new ObjectId(bookingId) });
      
      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        );
      }

      // Get doctor's average time per patient
      const doctor = await DoctorModel.getDoctorById(booking.doctorId.toString());
      const averageTimePerPatient = doctor?.averageTimePerPatient || 15;

      // Cancel booking and adjust subsequent appointment times
      await Booking.cancelAndAdjustTimes(bookingId, averageTimePerPatient);
    } else if (status === "completed" && actualDurationMinutes) {
      // Complete booking and adjust subsequent appointment times based on actual duration
      await Booking.completeAndAdjustTimes(bookingId, actualDurationMinutes);

      // If consultationResult is provided, save it to the booking
      if (consultationResult) {
        const collection = await Booking.collection();
        await collection.updateOne(
          { _id: new ObjectId(bookingId) },
          { $set: { consultationResult } }
        );
      }
    } else {
      // For other status updates, just update the status
      const result = await Booking.updateStatus(bookingId, status);

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: "Booking status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
