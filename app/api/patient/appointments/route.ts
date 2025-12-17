import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/db/config/mongodb";
import { verifyToken } from "@/lib/auth-helper";
import BookingModel from "@/db/models/Booking";
import DoctorModel from "@/db/models/Doctor";
// ServiceModel removed - service info can be retrieved from booking if needed
import ReviewModel from "@/db/models/Review";
import MedicalRecordModel from "@/db/models/MedicalRecord";
import InvoiceModel from "@/db/models/Invoice";

export async function GET(req: Request) {
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

    // ✅ 2. Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const sort = searchParams.get("sort") || "date-desc";

    const db = await getDb();
    const patientObjectId = new ObjectId(userId);

    // ✅ 3. Build query
    const query: any = { patientId: patientObjectId };

    // Filter by status
    if (status !== "all") {
      if (status === "upcoming") {
        // Upcoming: confirmed or in-progress with appointmentTime >= now
        const now = new Date();
        query.$or = [
          { status: "confirmed", appointmentTime: { $gte: now } },
          { status: "in-progress" }
        ];
      } else {
        query.status = status;
      }
    }

    // ✅ 4. Get bookings
    const bookingsCollection = db.collection("bookings");
    let bookingsQuery = bookingsCollection.find(query);

    // Sorting
    if (sort === "date-desc") {
      bookingsQuery = bookingsQuery.sort({ appointmentTime: -1 });
    } else if (sort === "date") {
      bookingsQuery = bookingsQuery.sort({ appointmentTime: 1 });
    }

    // Pagination
    bookingsQuery = bookingsQuery.skip(offset).limit(limit);

    const bookings = await bookingsQuery.toArray();

    // ✅ 5. Get summary counts
    const allCount = await bookingsCollection.countDocuments({ patientId: patientObjectId });
    const upcomingCount = await bookingsCollection.countDocuments({
      patientId: patientObjectId,
      $or: [
        { status: "confirmed", appointmentTime: { $gte: new Date() } },
        { status: "in-progress" }
      ]
    });
    const completedCount = await bookingsCollection.countDocuments({
      patientId: patientObjectId,
      status: "completed"
    });
    const cancelledCount = await bookingsCollection.countDocuments({
      patientId: patientObjectId,
      status: "cancelled"
    });

    // ✅ 6. Enrich bookings with doctor, service, review, medical record, invoice info
    const doctorsCollection = db.collection("doctors");
    const reviewsCollection = db.collection("reviews");
    const medicalRecordsCollection = db.collection("medicalrecords");
    const invoicesCollection = db.collection("invoices");

    const enrichedAppointments = await Promise.all(
      bookings.map(async (booking) => {
        // Get doctor info
        const doctor = await doctorsCollection.findOne({
          _id: new ObjectId(booking.doctorId)
        });

        // Get service info (if serviceId exists in booking)
        let serviceInfo = null;
        if (booking.serviceId) {
          // Service info can be retrieved from services collection if needed
          // For now, we'll just store the serviceId
          serviceInfo = {
            serviceId: booking.serviceId,
            name: booking.serviceName || "Medical Service",
            price: booking.servicePrice || 0
          };
        }

        // Get review
        const review = await reviewsCollection.findOne({
          bookingId: new ObjectId(booking._id)
        });

        // Get medical record
        const medicalRecord = await medicalRecordsCollection.findOne({
          bookingId: new ObjectId(booking._id)
        });

        // Get invoice
        const invoice = await invoicesCollection.findOne({
          bookingId: new ObjectId(booking._id)
        });

        // Map status for UI
        let statusDisplay: "upcoming" | "completed" | "cancelled" = "upcoming";
        if (booking.status === "completed") {
          statusDisplay = "completed";
        } else if (booking.status === "cancelled") {
          statusDisplay = "cancelled";
        } else {
          statusDisplay = "upcoming";
        }

        // Format date
        const appointmentDate = new Date(booking.appointmentTime);
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });

        // Format time
        const time = appointmentDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        });

        return {
          bookingId: booking._id.toString(),
          bookingNumber: booking.bookingNumber || "",
          date: booking.appointmentTime,
          formattedDate: formattedDate,
          time: time,
          appointmentTime: booking.appointmentTime,
          status: booking.status,
          statusDisplay: statusDisplay,
          doctor: doctor ? {
            doctorId: doctor._id.toString(),
            name: doctor.name,
            specialization: doctor.specialization,
            clinic: doctor.clinic,
            rating: doctor.averageRating || 0,
            totalReviews: doctor.totalReviews || 0,
            image: doctor.image
          } : null,
          service: serviceInfo,
          complaint: booking.complaint || "",
          queueNumber: booking.queueNumber || null,
          hasReview: !!review,
          review: review ? {
            reviewId: review._id.toString(),
            rating: review.rating,
            comment: review.comment || "",
            createdAt: review.createdAt
          } : null,
          hasMedicalRecord: !!medicalRecord,
          hasInvoice: !!invoice,
          invoiceId: invoice ? invoice._id.toString() : null,
          invoice: invoice
            ? {
                _id: invoice._id.toString(),
                status: invoice.status,
                invoiceNumber: invoice.invoiceNumber || "",
                total: invoice.total,
              }
            : null,
        };
      })
    );

    // ✅ 7. Return response
    return NextResponse.json({
      appointments: enrichedAppointments,
      total: allCount,
      hasMore: offset + limit < allCount,
      summary: {
        all: allCount,
        upcoming: upcomingCount,
        completed: completedCount,
        cancelled: cancelledCount
      }
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

