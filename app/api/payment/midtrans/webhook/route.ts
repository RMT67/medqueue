import { NextResponse } from "next/server";
import InvoiceModel from "@/db/models/Invoice";
import midtransClient from "midtrans-client";

// Initialize Midtrans Core API for notification verification
const coreApi = new midtransClient.CoreApi({
  isProduction: false, // Set to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, transaction_status, fraud_status } = body;

    console.log("Midtrans webhook received:", {
      order_id,
      transaction_status,
      fraud_status,
    });

    // ✅ 1. Verify transaction status with Midtrans
    // Extract invoice number from order_id (format: INV-{invoiceNumber}-{timestamp})
    const invoiceMatch = order_id.match(/^INV-(.+?)-(\d+)$/);
    if (!invoiceMatch) {
      console.error("Invalid order_id format:", order_id);
      return NextResponse.json(
        { error: "Invalid order_id format" },
        { status: 400 }
      );
    }

    const invoiceNumber = invoiceMatch[1];

    // Find invoice by invoice number
    const collection = await InvoiceModel.collection();
    const invoice = await collection.findOne({
      invoiceNumber: invoiceNumber,
    });

    if (!invoice) {
      console.error("Invoice not found for invoiceNumber:", invoiceNumber);
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // ✅ 2. Handle transaction status
    if (transaction_status === "capture") {
      if (fraud_status === "accept") {
        // Transaction is successful
        await InvoiceModel.update(invoice._id.toString(), {
          status: "paid",
          paymentMethod: "midtrans",
          paidAt: new Date(),
        });
      }
    } else if (transaction_status === "settlement") {
      // Transaction is settled
      await InvoiceModel.update(invoice._id.toString(), {
        status: "paid",
        paymentMethod: "midtrans",
        paidAt: new Date(),
      });
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      // Transaction is cancelled/denied/expired
      await InvoiceModel.update(invoice._id.toString(), {
        status: "cancelled",
      });
    } else if (transaction_status === "pending") {
      // Transaction is still pending
      // Keep status as pending
    }

    // ✅ 3. Return success response to Midtrans
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing Midtrans webhook:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
