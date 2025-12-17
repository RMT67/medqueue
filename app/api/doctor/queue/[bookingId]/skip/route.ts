import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import {
  emitQueueStatusChange,
  recalculateAndEmitCallTimeUpdates,
} from "@/lib/socket-server";
import DoctorModel from "@/db/models/Doctor";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> | { bookingId: string } }
) {
  try {
    // ✅ 1. Authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = verifyToken(authHeader);
    if (role !== "doctor") {
      return NextResponse.json(
        { error: "Forbidden - Doctor access only" },
        { status: 403 }
      );
    }

    // ✅ Handle Next.js 15 params (can be Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { bookingId } = resolvedParams;

    // ✅ 2. Validate bookingId format
    if (!bookingId || !ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    // const doctorObjectId = new ObjectId(userId);
    const doctorLogin = await DoctorModel.getDoctorByUserId(userId);
    if (!doctorLogin) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }
    const doctorObjectId = doctorLogin._id;

    const bookingsCollection = db.collection("bookings");

    // ✅ 3. Get booking and verify it belongs to this doctor
    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId),
      doctorId: doctorObjectId,
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to doctor" },
        { status: 404 }
      );
    }

    // ✅ 4. Validate: Can only skip confirmed or in-progress bookings
    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot skip completed appointment" },
        { status: 400 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // ✅ 5. Update booking status to cancelled (marked as no-show/skipped)
    await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "cancelled",
          cancelReason: "Skipped by doctor - Patient no-show",
          updatedAt: new Date(),
        },
      }
    );

    // ✅ 6. Get updated booking
    const updatedBooking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId),
    });

    // ✅ 7. Emit socket event for status change
    emitQueueStatusChange(bookingId, {
      queueStatus: "cancelled",
    });

    // ✅ 8. Recalculate and emit call time updates to all remaining patients in the same queue
    try {
      const scheduleDate = booking.scheduleDate
        ? new Date(booking.scheduleDate)
        : booking.appointmentTime
        ? new Date(booking.appointmentTime)
        : new Date();

      await recalculateAndEmitCallTimeUpdates(
        booking.doctorId.toString(),
        scheduleDate,
        bookingId // Pass skipped booking ID to exclude it from recalculation
      );
    } catch (error) {
      console.error("Error recalculating call times after skip:", error);
      // Don't fail the request if recalculation fails
    }

    return NextResponse.json({
      message: "Patient skipped successfully",
      booking: {
        bookingId: updatedBooking?._id.toString(),
        status: updatedBooking?.status,
        cancelReason: updatedBooking?.cancelReason,
      },
    });
  } catch (error) {
    console.error("Error skipping patient:", error);
    return NextResponse.json(
      { error: "Failed to skip patient" },
      { status: 500 }
    );
  }
}
