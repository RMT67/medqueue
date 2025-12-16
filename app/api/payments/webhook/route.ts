import { NextResponse } from "next/server";
import { getDb } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto";

export const runtime = "nodejs";

type MidtransStatus =
  | "capture"
  | "settlement"
  | "pending"
  | "deny"
  | "cancel"
  | "expire"
  | "refund"
  | "partial_refund"
  | "chargeback"
  | "partial_chargeback";

export async function POST(req: Request) {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY is not configured");
      return NextResponse.json(
        { error: "Server key not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    }: {
      order_id?: string;
      status_code?: string;
      gross_amount?: string;
      signature_key?: string;
      transaction_status?: MidtransStatus;
      fraud_status?: string;
      payment_type?: string;
      transaction_id?: string;
    } = body || {};

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const rawSignature = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(rawSignature)
      .digest("hex");
    if (expectedSignature !== signature_key) {
      console.warn("Invalid Midtrans signature for order_id", order_id);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const db = await getDb();
    const invoices = db.collection("invoices");

    // Prefer snapOrderId, fallback invoiceNumber
    const invoice =
      (await invoices.findOne({ snapOrderId: order_id })) ||
      (await invoices.findOne({ invoiceNumber: order_id }));

    if (!invoice) {
      console.warn("Invoice not found for order_id", order_id);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    let newStatus: "pending" | "paid" | "cancelled" = "pending";
    let paidAt: Date | undefined;

    if (
      transaction_status === "settlement" ||
      transaction_status === "capture"
    ) {
      if (fraud_status !== "deny") {
        newStatus = "paid";
        paidAt = new Date();
      } else {
        newStatus = "cancelled";
      }
    } else if (transaction_status === "pending") {
      newStatus = "pending";
    } else {
      // deny, cancel, expire, refund, chargeback, etc.
      newStatus = "cancelled";
    }

    const update: any = {
      transactionStatus: transaction_status,
      fraudStatus: fraud_status,
      paymentType: payment_type,
      transactionId: transaction_id,
      updatedAt: new Date(),
      status: newStatus,
    };
    if (paidAt) {
      update.paidAt = paidAt;
    }

    const invoiceId =
      typeof invoice._id === "string" ? new ObjectId(invoice._id) : invoice._id;

    await invoices.updateOne({ _id: invoiceId }, { $set: update });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error handling Midtrans webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/*
Manual test (local tunnel):
- Set env: MIDTRANS_SERVER_KEY, NEXT_PUBLIC_MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION=false.
- Expose Next API via HTTPS tunnel (e.g., VS Code forwarded port) and set webhook URL in Midtrans Dashboard to: https://<tunnel>/api/payments/webhook
- Trigger a sandbox payment; check invoices collection status, transactionStatus, fraudStatus, paymentType, transactionId, paidAt.
*/
