import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import {
  emitQueueStatusChange,
  recalculateAndEmitCallTimeUpdates,
} from "@/lib/socket-server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    // ✅ 1. Authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = verifyToken(authHeader);
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Forbidden - Patient access only" },
        { status: 403 }
      );
    }

    // ✅ Handle Next.js 16 params (Promise)
    const { bookingId } = await params;

    // ✅ Parse body safely (handle empty body)
    let cancelReason = "";
    try {
      const contentType = req.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const body = await req.json();
        cancelReason = body.cancelReason || "";
      }
    } catch (error) {
      // Body is optional, continue with empty cancelReason
    }

    const db = await getDb();
    const patientObjectId = new ObjectId(userId);
    const bookingsCollection = db.collection("bookings");

    // ✅ 2. Validate bookingId format
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    if (typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "Invalid booking ID format" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const bookingObjectId = new ObjectId(bookingId);

    // ✅ 3. Get booking and verify ownership
    // Try to find booking first without patientId filter to see if it exists
    const bookingExists = await bookingsCollection.findOne({
      _id: bookingObjectId,
    });

    if (!bookingExists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if patientId matches (handle both ObjectId and string formats)
    const bookingPatientId =
      bookingExists.patientId instanceof ObjectId
        ? bookingExists.patientId.toString()
        : bookingExists.patientId?.toString();
    const requestPatientId = patientObjectId.toString();

    if (bookingPatientId !== requestPatientId) {
      return NextResponse.json(
        { error: "Booking does not belong to patient" },
        { status: 403 }
      );
    }

    const booking = bookingExists;

    // ✅ 3. Validate: Can only cancel confirmed or in-progress bookings
    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel completed appointment" },
        { status: 400 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // ✅ 4. Update booking status
    await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "cancelled",
          cancelReason: cancelReason || "",
          updatedAt: new Date(),
        },
      }
    );

    // ✅ 5. Get updated booking
    const updatedBooking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId),
    });

    // ✅ 6. Emit socket event for status change
    emitQueueStatusChange(bookingId, {
      queueStatus: "cancelled",
    });

    // ✅ 7. Recalculate and emit call time updates to all remaining patients in the same queue
    try {
      const scheduleDate = booking.scheduleDate
        ? new Date(booking.scheduleDate)
        : booking.appointmentTime
        ? new Date(booking.appointmentTime)
        : new Date();

      await recalculateAndEmitCallTimeUpdates(
        booking.doctorId.toString(),
        scheduleDate,
        bookingId // Pass cancelled booking ID to exclude it from recalculation
      );
    } catch (error) {
      console.error(
        "Error recalculating call times after cancellation:",
        error
      );
      // Don't fail the request if recalculation fails
    }

    return NextResponse.json({
      message: "Appointment cancelled successfully",
      booking: {
        bookingId: updatedBooking?._id.toString(),
        status: updatedBooking?.status,
        cancelReason: updatedBooking?.cancelReason,
      },
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
