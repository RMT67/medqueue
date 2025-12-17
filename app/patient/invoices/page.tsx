"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  Receipt,
  Calendar,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Pill,
  Stethoscope,
  Clock,
  FileText,
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { FadeIn } from "@/components/animations";
import Swal from "sweetalert2";

interface InvoiceItem {
  type: "consultation" | "medicine" | "service";
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface MedicationReceipt {
  medicines: Array<{
    name: string;
    dosage: string;
    quantity: number;
    price: number;
  }>;
}

interface InvoiceData {
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  formattedDate: string;
  status: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  medicationReceipt: MedicationReceipt | null;
  dueDate: string;
  paymentMethod: string | null;
  paidAt: string | null;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const bookingId = searchParams.get("bookingId");
  const status = searchParams.get("status") || "pending";

  useEffect(() => {
    if (!bookingId) {
      setError("Booking ID is required");
      setIsLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("medqueue_token");
        if (!token) {
          setError("Authentication required");
          return;
        }

        const response = await fetch(
          `/api/patient/invoices?bookingId=${bookingId}&status=${status}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
        } else {
          const errorData = await response.json().catch(() => null);
          setError(errorData?.error || "Failed to fetch invoice");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        setError("Failed to fetch invoice");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [bookingId, status]);

  const handlePayment = async () => {
    if (!invoice) return;

    try {
      setIsProcessingPayment(true);
      const token = localStorage.getItem("medqueue_token");
      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "Authentication Required",
          text: "Please login to process payment",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      // Create Midtrans payment transaction
      const response = await fetch(`/api/payment/midtrans/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceId: invoice.invoiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        await Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: errorData?.error || "Failed to create payment",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      const data = await response.json();
      const { token: snapToken, redirect_url } = data;

      // Load Midtrans Snap script dynamically
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
      if (!clientKey) {
        await Swal.fire({
          icon: "error",
          title: "Configuration Error",
          text: "Payment configuration is missing. Please contact support.",
          confirmButtonColor: "#ef4444",
        });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", clientKey);
      script.onload = () => {
        // @ts-ignore - Midtrans Snap is loaded globally
        if (window.snap) {
          // @ts-ignore
          window.snap.pay(snapToken, {
            onSuccess: async (result: any) => {
              console.log("Payment success:", result);
              
              // Wait a bit for webhook to process, then retry fetching invoice
              const fetchUpdatedInvoice = async (retries = 5) => {
                for (let i = 0; i < retries; i++) {
                  // Try with paid status first
                  let updatedResponse = await fetch(
                    `/api/patient/invoices?bookingId=${bookingId}&status=paid`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  if (updatedResponse.ok) {
                    const invoiceData = await updatedResponse.json();
                    setInvoice(invoiceData);
                    await Swal.fire({
                      icon: "success",
                      title: "Payment Successful!",
                      text: "Your payment has been processed successfully.",
                      confirmButtonColor: "#10b981",
                    });
                    return;
                  }

                  // If not found with paid status, try with pending (webhook might not have processed yet)
                  if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                  }
                }

                // Final attempt: try without status filter to get latest status
                const finalResponse = await fetch(
                  `/api/patient/invoices?bookingId=${bookingId}&status=pending`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                if (finalResponse.ok) {
                  const invoiceData = await finalResponse.json();
                  setInvoice(invoiceData);
                  await Swal.fire({
                    icon: "info",
                    title: "Payment Processing",
                    text: "Payment is being processed. Please refresh the page in a moment.",
                    confirmButtonColor: "#3b82f6",
                  });
                } else {
                  await Swal.fire({
                    icon: "success",
                    title: "Payment Successful!",
                    text: "Payment successful! Please refresh the page to see updated status.",
                    confirmButtonColor: "#10b981",
                  });
                }
              };

              await fetchUpdatedInvoice();
            },
            onPending: (result: any) => {
              console.log("Payment pending:", result);
              Swal.fire({
                icon: "info",
                title: "Payment Pending",
                text: "Payment is pending. Please complete the payment.",
                confirmButtonColor: "#3b82f6",
              });
            },
            onError: (result: any) => {
              console.error("Payment error:", result);
              Swal.fire({
                icon: "error",
                title: "Payment Failed",
                text: "Payment failed. Please try again.",
                confirmButtonColor: "#ef4444",
              });
            },
            onClose: () => {
              console.log("Payment popup closed");
            },
          });
        } else {
          // Fallback to redirect if Snap is not available
          window.location.href = redirect_url;
        }
      };
      script.onerror = () => {
        // Fallback to redirect if script fails to load
        window.location.href = redirect_url;
      };
      document.body.appendChild(script);
    } catch (error) {
      console.error("Error processing payment:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to process payment",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "service":
        return <Stethoscope className="w-4 h-4" />;
      case "medicine":
        return <Pill className="w-4 h-4" />;
      case "consultation":
        return <FileText className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case "service":
        return "Service";
      case "medicine":
        return "Medicine";
      case "consultation":
        return "Consultation";
      default:
        return "Item";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <FadeIn>
            {/* Header */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg ring-2 ring-primary/10">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Invoice Details
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    View your invoice information and payment details
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <Card className="p-8 text-center border border-border/50 shadow-sm">
                <p className="text-muted-foreground">Loading invoice...</p>
              </Card>
            ) : error ? (
              <Card className="p-8 text-center border border-border/50 shadow-sm">
                <p className="text-destructive font-semibold">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/my-queue")}
                  className="mt-4"
                >
                  Go to My Queue
                </Button>
              </Card>
            ) : invoice ? (
              <div className="space-y-6">
                {/* Invoice Header Card */}
                <Card className="p-6 border border-border/50 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">
                        Invoice Number
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {invoice.invoiceNumber}
                      </p>
                    </div>
                    <div className="flex flex-col md:items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">
                          Status:
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                              : invoice.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                          }`}
                        >
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(invoice.date)}</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Invoice Items */}
                <Card className="p-6 border border-border/50 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Invoice Items
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, index) => (
                        <div
                          key={index}
                          className="p-4 bg-muted/30 rounded-xl border border-border/50"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                {getItemIcon(item.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-foreground">
                                    {item.name}
                                  </p>
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                    {getItemTypeLabel(item.type)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Qty: {item.quantity}</span>
                                  <span>
                                    @ Rp{" "}
                                    {item.unitPrice.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-foreground">
                                Rp {item.total.toLocaleString("id-ID")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No items found
                      </p>
                    )}
                  </div>

                  {/* Total Section */}
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Subtotal
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        Rp {invoice.subtotal.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-lg font-bold text-foreground">
                        Total Amount
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        Rp {invoice.total.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Medication Receipt */}
                {invoice.medicationReceipt &&
                  invoice.medicationReceipt.medicines.length > 0 && (
                    <Card className="p-6 border border-border/50 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center ring-2 ring-accent/10">
                          <Pill className="w-5 h-5 text-accent" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">
                          Medication Receipt
                        </h2>
                      </div>

                      <div className="space-y-3">
                        {invoice.medicationReceipt.medicines.map(
                          (medicine, index) => (
                            <div
                              key={index}
                              className="p-4 bg-accent/10 rounded-xl border border-accent/30"
                            >
                              <p className="text-base font-semibold text-foreground mb-1.5">
                                {medicine.name}
                              </p>
                              <p className="text-sm text-muted-foreground mb-2">
                                {medicine.dosage} • Qty: {medicine.quantity}
                              </p>
                              <p className="text-sm font-bold text-accent">
                                Rp {medicine.price.toLocaleString("id-ID")}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </Card>
                  )}

                {/* Payment Information */}
                <Card className="p-6 border border-border/50 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Payment Information
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Due Date
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>

                    {invoice.status === "paid" && (
                      <>
                        {invoice.paymentMethod && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Payment Method
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {invoice.paymentMethod}
                            </span>
                          </div>
                        )}
                        {invoice.paidAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Paid At
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              {formatDateTime(invoice.paidAt)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-4 py-3 bg-green-50/80 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-xl border border-green-200/50 dark:border-green-800/50">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-semibold">
                            Payment Completed
                          </span>
                        </div>
                      </>
                    )}

                    {invoice.status === "pending" && (
                      <Button
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                      >
                        <CreditCard className="w-5 h-5" />
                        {isProcessingPayment
                          ? "Processing..."
                          : "Process Payment"}
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            ) : null}
          </FadeIn>
        </div>
      </div>
    </ProtectedRoute>
  );
}
