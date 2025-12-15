import { getDb } from "@/db/config/mongodb";

export async function generateInvoiceNumber(): Promise<string> {
  const db = await getDb();
  const invoicesCollection = db.collection("invoices");
  
  // Get last invoice number
  const lastInvoice = await invoicesCollection
    .find({})
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  const year = new Date().getFullYear().toString();
  let invoiceNumber: string;

  if (lastInvoice.length === 0) {
    invoiceNumber = `INV-${year}-0001`;
  } else {
    const lastNumber = lastInvoice[0].invoiceNumber;
    const parts = lastNumber.split("-");
    const lastYear = parts[1];
    const lastSeq = parseInt(parts[2], 10);

    if (lastYear === year) {
      // Same year, increment sequence
      const newSeq = lastSeq + 1;
      invoiceNumber = `INV-${year}-${newSeq.toString().padStart(4, "0")}`;
    } else {
      // New year, reset sequence
      invoiceNumber = `INV-${year}-0001`;
    }
  }

  return invoiceNumber;
}

export function calculateDueDate(invoiceDate: Date, days: number = 7): Date {
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
}

