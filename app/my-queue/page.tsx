"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navigation } from "@/components/navigation";
import { QueueCard } from "@/components/queue-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Star,
  Clock,
  Calendar,
  ArrowRight,
  User,
  Mail,
  Phone,
  ListOrdered,
  Receipt,
  Pill,
  CreditCard,
} from "lucide-react";
import { ReviewDoctorModal } from "@/components/review-doctor-modal";
import { useAuth } from "@/lib/auth-context";

type QueueDoctor = {
  _id: string;
  name: string;
  specialization: string;
  clinic?: string;
  rating?: number;
  totalReviews?: number;
  image?: string;
};

type QueueInvoice = {
  _id: string;
  invoiceNumber?: string;
  status: string;
  total?: number;
};

type QueueItem = {
  _id: string;
  bookingId: string;
  bookingNumber?: string;
  status: string;
  queueNumber?: string;
  scheduleDate?: string | null;
  appointmentTime?: string | null;
  timeRange?: string | null;
  complaint?: string;
  doctor: QueueDoctor | null;
  invoice: QueueInvoice | null;
};

export default function MyQueuePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "patient")) {
      setIsLoadingQueue(false);
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const fetchQueues = useCallback(async () => {
    try {
      setIsLoadingQueue(true);
      setError(null);

      const token = localStorage.getItem("medqueue_token");
      if (!token) {
        setQueues([]);
        return;
      }

      const res = await fetch("/api/patient/my-queue", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setQueues(data.queues || []);
        return;
      }

      const errorBody = await res.json().catch(() => null);
      setQueues([]);
      setError(errorBody?.error || "Failed to fetch queues");
    } catch (error) {
      console.error("Error fetching my queue:", error);
      setQueues([]);
      setError("Failed to fetch queues");
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === "patient") {
      fetchQueues();
    }
  }, [user, fetchQueues]);

  const currentQueue = useMemo(() => queues[0] || null, [queues]);
  const completedQueues = useMemo(
    () => queues.filter((q) => q.status === "completed"),
    [queues]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={!!user}
        userRole={user?.role}
        userName={user?.name}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">
              My Queue
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              Track your visit in real-time
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              See your active bookings, queue position, and invoices. Payment
              and review will appear when available.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-3 bg-card/80 border border-border/50 rounded-2xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">
                  Active
                </p>
                <p className="text-lg font-bold text-foreground">
                  {currentQueue ? 1 : 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-card/80 border border-border/50 rounded-2xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ListOrdered className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">
                  Completed
                </p>
                <p className="text-lg font-bold text-foreground">
                  {completedQueues.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoadingQueue ? (
          <div className="min-h-[320px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center border border-border/50 shadow-sm space-y-4">
            <p className="text-lg font-semibold text-foreground">
              Unable to load your queue
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex justify-center">
              <Button onClick={fetchQueues}>
                Retry
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        ) : queues.length === 0 ? (
          <Card className="p-8 text-center border border-border/50 shadow-sm">
            <p className="text-lg font-semibold text-foreground mb-2">
              No active bookings yet
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Book a doctor to see your queue and invoices here.
            </p>
            <Button onClick={() => router.push("/doctors")}>
              Find Doctor
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            <div className="lg:col-span-2 space-y-6">
              {currentQueue && (
                <QueueCard
                  currentlyServing={currentQueue.queueNumber || ""}
                  patientsAhead={0}
                  estimatedTime={0}
                  doctorName={currentQueue.doctor?.name || "Doctor"}
                  doctorSpecialization={
                    currentQueue.doctor?.specialization || ""
                  }
                  doctorClinic={currentQueue.doctor?.clinic || ""}
                  doctorRating={currentQueue.doctor?.rating || 0}
                  doctorReviews={currentQueue.doctor?.totalReviews || 0}
                  doctorImage={currentQueue.doctor?.image}
                  status={
                    currentQueue.status === "in-progress"
                      ? "being-served"
                      : currentQueue.status === "completed"
                      ? "completed"
                      : "waiting"
                  }
                  appointmentDate={currentQueue.scheduleDate || undefined}
                  appointmentTime={currentQueue.appointmentTime || undefined}
                  timeRange={currentQueue.timeRange || undefined}
                  patientComplaint={currentQueue.complaint}
                  bookingId={currentQueue.bookingId}
                  onRate={
                    currentQueue.status === "completed" &&
                    currentQueue.invoice?.status === "paid"
                      ? () => {
                          setSelectedDoctor(currentQueue.doctor?.name || "");
                          setShowRatingModal(true);
                        }
                      : undefined
                  }
                />
              )}

              {queues.length > 1 && (
                <Card className="p-6 border border-border/50 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ListOrdered className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-semibold">
                        Other Bookings
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {queues.length - 1} more
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {queues.slice(1).map((q) => (
                      <div
                        key={q.bookingId || q._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {q.doctor?.name || "Doctor"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {q.doctor?.specialization || ""} -{" "}
                            {q.status.toUpperCase()}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {q.queueNumber || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="p-6 bg-card/90 border border-border/50 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-semibold">
                        Invoice
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {currentQueue?.invoice?.invoiceNumber ||
                          "Not available"}
                      </p>
                    </div>
                  </div>

                  {!currentQueue?.invoice && (
                    <p className="text-sm text-muted-foreground">
                      Invoice will be available after consultation is completed.
                    </p>
                  )}

                  {currentQueue?.invoice && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {currentQueue.invoice.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total
                        </span>
                        <span className="text-xl font-bold text-primary">
                          Rp{" "}
                          {currentQueue.invoice.total?.toLocaleString("id-ID")}
                        </span>
                      </div>
                      {currentQueue.invoice.status === "pending" && (
                        <Button
                          className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                          onClick={() => alert("Payment flow coming soon")}
                        >
                          <CreditCard className="w-5 h-5" />
                          Process Payment
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {selectedDoctor && currentQueue && (
          <ReviewDoctorModal
            isOpen={showRatingModal}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedDoctor(null);
            }}
            doctorName={selectedDoctor}
            onSubmit={async (rating, feedback) => {
              try {
                const token = localStorage.getItem("medqueue_token");
                if (!token) return;

                const response = await fetch("/api/patient/reviews", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    bookingId: currentQueue.bookingId,
                    doctorId: currentQueue.doctor?._id,
                    rating,
                    comment: feedback || "",
                  }),
                });

                if (response.ok) {
                  setShowRatingModal(false);
                  setSelectedDoctor(null);
                  await fetchQueues();
                } else {
                  const error = await response.json();
                  alert(error.error || "Failed to submit review");
                }
              } catch (error) {
                console.error("Error submitting review:", error);
                alert("Failed to submit review");
              }
            }}
          />
        )}

        <div className="mt-12 lg:mt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Past Appointments
              </h2>
              <p className="text-sm text-muted-foreground">
                View your previous healthcare visits
              </p>
            </div>
            <Button
              onClick={() => router.push("/patient/appointments")}
              variant="outline"
              className="border-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 w-full sm:w-auto h-11 font-medium shadow-sm hover:shadow-md"
            >
              <Calendar className="w-4 h-4" />
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedQueues.length > 0 ? (
              completedQueues.map((appointment) => {
                const initials = (appointment.doctor?.name || "D")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <Card
                    key={appointment.bookingId}
                    className="p-6 border border-border/50 hover:shadow-2xl transition-all duration-500 bg-card/95 backdrop-blur-sm hover:border-primary/30 group"
                  >
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div
                          className="relative w-18 h-18 rounded-2xl overflow-hidden border-2 border-border/50 flex-shrink-0 shadow-lg ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all"
                          style={{ width: "4.5rem", height: "4.5rem" }}
                        >
                          {appointment.doctor?.image ? (
                            <>
                              <Image
                                src={appointment.doctor.image}
                                alt={appointment.doctor.name}
                                fill
                                unoptimized
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="image-fallback hidden w-full h-full items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-xl">
                                {initials}
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-xl">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors duration-300">
                            {appointment.doctor?.name || "Doctor"}
                          </p>
                          <p className="text-sm text-primary font-semibold mb-1">
                            {appointment.doctor?.specialization || ""}
                          </p>
                          <p className="text-sm text-muted-foreground truncate font-medium">
                            {appointment.doctor?.clinic || ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-5 border-t border-border/50">
                        <p className="text-sm font-semibold text-muted-foreground">
                          {appointment.appointmentTime
                            ? new Date(
                                appointment.appointmentTime
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </p>
                        {appointment.doctor?.rating > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="text-base font-bold text-foreground">
                              {appointment.doctor.rating.toFixed(1)}
                            </span>
                            {appointment.doctor.totalReviews > 0 && (
                              <span className="text-sm text-muted-foreground">
                                ({appointment.doctor.totalReviews})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                No past appointments found
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
