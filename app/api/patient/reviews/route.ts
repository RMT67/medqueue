import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import ReviewModel from "@/db/models/Review";
import DoctorModel from "@/db/models/Doctor";

interface CreateReviewRequest {
  bookingId: string;
  doctorId: string;
  rating: number;
  comment?: string;
}

export async function POST(req: Request) {
  try {
    // ✅ 1. Authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = verifyToken(authHeader.split(" ")[1]);
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Forbidden - Patient access only" },
        { status: 403 }
      );
    }

    // ✅ 2. Get request body
    const body: CreateReviewRequest = await req.json();
    const { bookingId, doctorId, rating, comment } = body;

    // ✅ 3. Validate required fields
    if (!bookingId || !doctorId || !rating) {
      return NextResponse.json(
        { error: "bookingId, doctorId, and rating are required" },
        { status: 400 }
      );
    }

    // ✅ 4. Validate rating (1-5)
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // ✅ 5. Validate booking exists and belongs to patient
    const db = await getDb();
    const bookingsCollection = db.collection("bookings");
    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId),
      patientId: new ObjectId(userId),
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to patient" },
        { status: 404 }
      );
    }

    // ✅ 6. Validate booking is completed
    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "Can only review completed appointments" },
        { status: 400 }
      );
    }

    // ✅ 7. Check if review already exists
    const existingReview = await ReviewModel.getByBookingId(bookingId);
    if (existingReview) {
      return NextResponse.json(
        { error: "Review already exists for this booking" },
        { status: 409 }
      );
    }

    // ✅ 8. Create review
    const review = await ReviewModel.create({
      bookingId: new ObjectId(bookingId),
      patientId: new ObjectId(userId),
      doctorId: doctorId,
      rating: rating,
      comment: comment || "",
    });

    // ✅ 9. Update doctor's average rating and total reviews
    const doctor = await DoctorModel.getDoctorById(doctorId);
    if (doctor) {
      const reviewsCollection = db.collection("reviews");
      const allReviews = await reviewsCollection
        .find({ doctorId: doctorId })
        .toArray();

      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;
      const totalReviews = allReviews.length;

      await DoctorModel.update(doctorId, {
        averageRating: averageRating,
        totalReviews: totalReviews,
      });
    }

    // ✅ 10. Return response
    return NextResponse.json(
      {
        message: "Review submitted successfully",
        review: {
          reviewId: review._id?.toString(),
          bookingId: bookingId,
          doctorId: doctorId,
          patientId: userId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
