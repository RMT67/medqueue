"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Receipt, Calendar, DollarSign, User, Stethoscope } from "lucide-react";
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
  patientName?: string;
  doctorName?: string;
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
      <Card className="p-12 text-center border-2 shadow-xl bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Receipt className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            No Invoices Found
          </h3>
          <p className="text-muted-foreground max-w-md">
            There are no invoices in the system yet. Invoices will appear here once they are generated.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Total Invoices
              </p>
              <p className="text-2xl font-bold text-foreground">
                {invoices.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-md">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {invoices.filter((i) => i.paymentStatus === "pending").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Paid
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {invoices.filter((i) => i.paymentStatus === "paid").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Cancelled
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {invoices.filter((i) => i.paymentStatus === "cancelled").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b-2 border-border sticky top-0">
              <tr>
                <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                  Invoice Number
                </th>
                <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                  Patient
                </th>
                <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                  Doctor
                </th>
                <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                  Due Date
                </th>
                <th className="text-right p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                  Total Amount
                </th>
                <th className="text-center p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="text-center p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice._id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-mono text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {invoice.patientName || `Patient ${invoice.patientId.slice(0, 8)}...`}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {invoice.doctorName || `Doctor ${invoice.doctorId.slice(0, 8)}...`}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(invoice.date)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(invoice.total)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <InvoiceStatusBadge status={invoice.paymentStatus} />
                  </td>
                  <td className="p-4 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetail(invoice._id)}
                      className="border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </Card>
    </div>
  );
}
