import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyToken } from "@/lib/auth-helper";
import InvoiceModel from "@/db/models/Invoice";
import connectDB from "@/lib/db";
import User from "@/db/models/User";
import midtransClient from "midtrans-client";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY;

const createSnapClient = () => {
  if (!MIDTRANS_SERVER_KEY || !MIDTRANS_CLIENT_KEY) {
    throw new Error("Midtrans credentials are not configured");
  }

  return new midtransClient.Snap({
    isProduction: false, // Set to true for production
    serverKey: MIDTRANS_SERVER_KEY,
    clientKey: MIDTRANS_CLIENT_KEY,
  });
};

export async function POST(req: Request) {
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

    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // ✅ 2. Get invoice and verify ownership
    const invoice = await InvoiceModel.getById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify ownership
    if (invoice.patientId.toString() !== userId) {
      return NextResponse.json(
        { error: "Forbidden - Invoice does not belong to patient" },
        { status: 403 }
      );
    }

    // ✅ 3. Validate invoice status
    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot pay a cancelled invoice" },
        { status: 400 }
      );
    }

    // ✅ 4. Get patient user data for customer details
    await connectDB();
    const patient = await User.findById(userId);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Validate email format
    const patientEmail = patient.email || `patient-${userId}@medqueue.ai`;
    if (!patientEmail.includes("@")) {
      return NextResponse.json(
        { error: "Invalid patient email format" },
        { status: 400 }
      );
    }

    // ✅ 5. Prepare Midtrans transaction parameter
    const parameter = {
      transaction_details: {
        order_id: `INV-${invoice.invoiceNumber}-${Date.now()}`,
        gross_amount: invoice.total,
      },
      item_details: invoice.items.map((item) => ({
        id: item.type,
        price: item.unitPrice,
        quantity: item.quantity,
        name: item.name,
      })),
      customer_details: {
        first_name: patient.fullName || "Patient",
        last_name: "",
        email: patientEmail,
        phone: patient.phoneNumber || "",
      },
      callbacks: {
        finish: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/patient/invoices?bookingId=${invoice.bookingId}&status=paid`,
        unfinish: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/patient/invoices?bookingId=${invoice.bookingId}&status=pending`,
        error: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/patient/invoices?bookingId=${invoice.bookingId}&status=pending`,
      },
    };

    // ✅ 6. Create Midtrans transaction
    const snap = createSnapClient();
    const transaction = await snap.createTransaction(parameter);

    // ✅ 7. Update invoice with transaction token
    await InvoiceModel.update(invoiceId, {
      paymentMethod: "midtrans",
      updatedAt: new Date(),
    });

    // ✅ 8. Return transaction token and redirect URL
    return NextResponse.json(
      {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        order_id: parameter.transaction_details.order_id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating Midtrans payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
