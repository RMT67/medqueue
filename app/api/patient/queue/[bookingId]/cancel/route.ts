import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import { emitQueueStatusChange } from "@/lib/socket-server";

export async function PATCH(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    // ✅ 1. Authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, role } = verifyToken(authHeader);
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Forbidden - Patient access only" },
        { status: 403 }
      );
    }

    const { bookingId } = params;
    const body = await req.json();
    const { cancelReason } = body;

    const db = await getDb();
    const patientObjectId = new ObjectId(userId);
    const bookingsCollection = db.collection("bookings");

    // ✅ 2. Get booking and verify ownership
    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId),
      patientId: patientObjectId
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to patient" },
        { status: 404 }
      );
    }

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
          updatedAt: new Date()
        }
      }
    );

    // ✅ 5. Get updated booking
    const updatedBooking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId)
    });

    // ✅ 6. Emit socket event for status change
    emitQueueStatusChange(bookingId, {
      queueStatus: "cancelled"
    });

    return NextResponse.json({
      message: "Appointment cancelled successfully",
      booking: {
        bookingId: updatedBooking?._id.toString(),
        status: updatedBooking?.status,
        cancelReason: updatedBooking?.cancelReason
      }
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}

