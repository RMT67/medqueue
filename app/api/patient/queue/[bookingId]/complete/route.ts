import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";

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

    // ✅ 3. Validate: Can only complete in-progress bookings
    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Appointment is already completed" },
        { status: 400 }
      );
    }

    if (booking.status !== "in-progress") {
      return NextResponse.json(
        { error: "Can only complete in-progress appointments" },
        { status: 400 }
      );
    }

    // ✅ 4. Update booking status
    const now = new Date();
    await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "completed",
          completedAt: now,
          updatedAt: now
        }
      }
    );

    // ✅ 5. Get updated booking
    const updatedBooking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId)
    });

    return NextResponse.json({
      message: "Appointment marked as completed successfully",
      booking: {
        bookingId: updatedBooking?._id.toString(),
        status: updatedBooking?.status,
        completedAt: updatedBooking?.completedAt
      }
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    return NextResponse.json(
      { error: "Failed to complete appointment" },
      { status: 500 }
    );
  }
}

