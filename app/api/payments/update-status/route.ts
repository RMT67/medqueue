import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth-helper";
import { getDb } from "@/db/config/mongodb";

type InvoiceStatus = "paid" | "pending";

export async function PATCH(req: Request) {
  try {
    // DEV ONLY
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Not available in production" },
        { status: 403 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = verifyToken(authHeader);
    if (role !== "patient") {
      return NextResponse.json(
        { error: "Forbidden - Patient access only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { invoiceId, status }: { invoiceId?: string; status?: InvoiceStatus } =
      body || {};

    if (!invoiceId || !status) {
      return NextResponse.json(
        { error: "invoiceId and status are required" },
        { status: 400 }
      );
    }

    if (!["paid", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Unsupported status transition" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const invoicesCollection = db.collection("invoices");
    const bookingsCollection = db.collection("bookings");

    const invoice = await invoicesCollection.findOne({
      _id: new ObjectId(invoiceId),
      patientId: new ObjectId(userId),
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending invoices can be updated in dev mode" },
        { status: 400 }
      );
    }

    const booking = invoice.bookingId
      ? await bookingsCollection.findOne({
          _id: new ObjectId(invoice.bookingId),
        })
      : null;

    if (status === "paid") {
      if (!booking || booking.status !== "completed") {
        return NextResponse.json(
          { error: "Booking must be completed before marking invoice paid" },
          { status: 400 }
        );
      }
    }

    const update: any = {
      status: status === "pending" ? "pending" : status,
      updatedAt: new Date(),
    };
    if (status === "paid") {
      update.paidAt = new Date();
    }

    await invoicesCollection.updateOne(
      { _id: new ObjectId(invoiceId) },
      { $set: update }
    );

    const updated = await invoicesCollection.findOne({
      _id: new ObjectId(invoiceId),
    });

    return NextResponse.json(
      { invoice: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating invoice status (DEV):", error);
    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 }
    );
  }
}
