"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { useRouter } from "next/navigation";
import { PaymentStatus } from "@/types/invoice";

interface InvoiceDisplay {
  _id: string;
  invoiceNumber: string;
  patientId: string;
  doctorId: string;
  date: string;
  dueDate: string;
  total: number;
  paymentStatus: PaymentStatus;
}

interface InvoiceTableProps {
  invoices: InvoiceDisplay[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetail = (invoiceId: string) => {
    router.push(`/admin/dashboard/invoices/${invoiceId}`);
  };

  if (invoices.length === 0) {
    return (
      <Card className="p-12 text-center border-2">
        <div className="flex flex-col items-center gap-4">
          <FileText className="w-16 h-16 text-muted-foreground/50" />
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No Invoices Found
            </h3>
            <p className="text-muted-foreground">
              There are no invoices in the system yet.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b-2">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                Invoice Number
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                Patient ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                Doctor ID
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                Due Date
              </th>
              <th className="px-6 py-4 text-right text-sm font-bold text-foreground">
                Total Amount
              </th>
              <th className="px-6 py-4 text-center text-sm font-bold text-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-center text-sm font-bold text-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr
                key={invoice._id}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {invoice.invoiceNumber}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground font-mono">
                    {invoice.patientId.slice(0, 8)}...
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground font-mono">
                    {invoice.doctorId.slice(0, 8)}...
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(invoice.date)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(invoice.dueDate)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(invoice.total)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <InvoiceStatusBadge status={invoice.paymentStatus} />
                </td>
                <td className="px-6 py-4 text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetail(invoice._id)}
                    className="hover:bg-primary hover:text-primary-foreground"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="border-t-2 bg-muted/30 px-6 py-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Total Invoices: <span className="font-bold">{invoices.length}</span>
          </span>
          <div className="flex gap-4">
            <span className="text-muted-foreground">
              Pending:{" "}
              <span className="font-bold text-yellow-600">
                {invoices.filter((i) => i.paymentStatus === "pending").length}
              </span>
            </span>
            <span className="text-muted-foreground">
              Paid:{" "}
              <span className="font-bold text-green-600">
                {invoices.filter((i) => i.paymentStatus === "paid").length}
              </span>
            </span>
            <span className="text-muted-foreground">
              Cancelled:{" "}
              <span className="font-bold text-red-600">
                {invoices.filter((i) => i.paymentStatus === "cancelled").length}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
