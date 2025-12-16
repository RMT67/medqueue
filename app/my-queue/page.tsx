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
  UserCircle,
  MapPin,
  CheckCircle2,
  MessageSquare,
  FileText,
} from "lucide-react";
import { ReviewDoctorModal } from "@/components/review-doctor-modal";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { ProfileUser } from "@/types/userTypes";
import Link from "next/link";
import { FadeIn } from "@/components/animations";
import { getSocket, joinQueueRoom, leaveQueueRoom } from "@/lib/socket-client";

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
  hasMedicalRecord?: boolean;
  hasInvoice?: boolean;
  hasReview?: boolean;
};

export default function MyQueuePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [patientProfile, setPatientProfile] = useState<ProfileUser | null>(null);
  const [queuePosition, setQueuePosition] = useState<{
    patientsAhead: number;
    estimatedTime: number;
    currentlyServing: string;
  } | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchQueuePosition = useCallback(async (bookingId: string) => {
    try {
      setIsLoadingPosition(true);
      const token = localStorage.getItem("medqueue_token");
      if (!token) return;

      const res = await fetch("/api/patient/queue/active", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.bookingId === bookingId) {
          setQueuePosition({
            patientsAhead: data.patientsAhead || 0,
            estimatedTime: data.estimatedTime || 0,
            currentlyServing: data.currentlyServing || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching queue position:", error);
    } finally {
      setIsLoadingPosition(false);
    }
  }, []);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        const data = await apiFetch<{ user: ProfileUser }>("/api/profile");
        setPatientProfile(data.user);
      } catch (error) {
        console.error("Error fetching patient profile:", error);
      }
    };

    if (user && user.role === "patient") {
      fetchPatientProfile();
    }
  }, [user]);

  const currentQueue = useMemo(() => queues[0] || null, [queues]);
  const completedQueues = useMemo(
    () => queues.filter((q) => q.status === "completed"),
    [queues]
  );

  useEffect(() => {
    if (currentQueue && currentQueue.status !== "completed") {
      fetchQueuePosition(currentQueue.bookingId);
    } else {
      setQueuePosition(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQueue?.bookingId, currentQueue?.status]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!user || user.role !== "patient" || !currentQueue || currentQueue.status === "completed") {
      return;
    }

    let socketCleanup: (() => void) | null = null;
    const bookingId = currentQueue.bookingId;

    // Dynamic import untuk client-side only
    import("@/lib/socket-client").then(({ getSocket, joinQueueRoom, leaveQueueRoom }) => {
      const socket = getSocket();
      if (!socket) {
        console.warn("⚠️ Socket not available - token may be missing");
        return;
      }

      console.log("🔌 Setting up Socket.IO for booking:", bookingId);

      // Wait for socket to connect before joining room
      if (socket.connected) {
        joinQueueRoom(bookingId);
      } else {
        socket.once("connect", () => {
          console.log("✅ Socket connected, joining queue room");
          joinQueueRoom(bookingId);
        });
      }

      // Listen for queue position updates
      const handlePositionUpdate = (data: {
        bookingId: string;
        currentlyServing: string;
        patientsAhead: number;
        queueNumber: string;
      }) => {
        if (data.bookingId === bookingId) {
          setQueuePosition((prev) => ({
            patientsAhead: data.patientsAhead,
            estimatedTime: prev?.estimatedTime || 0,
            currentlyServing: data.currentlyServing,
          }));
        }
      };

      // Listen for call time updates
      const handleCallTimeUpdate = (data: {
        bookingId: string;
        estimatedCallTime: string;
        estimatedCallTimeTimestamp: string;
        patientsAhead: number;
        estimatedTime: number;
      }) => {
        if (data.bookingId === bookingId) {
          setQueuePosition((prev) => ({
            patientsAhead: data.patientsAhead,
            estimatedTime: data.estimatedTime,
            currentlyServing: prev?.currentlyServing || "",
          }));
        }
      };

      // Listen for queue status changes
      const handleStatusChange = (data: {
        bookingId: string;
        queueStatus: "waiting" | "being-served" | "completed" | "cancelled";
        estimatedCallTime?: string;
        estimatedCallTimeTimestamp?: string;
      }) => {
        if (data.bookingId === bookingId) {
          // Refresh queues when status changes
          fetchQueues();
        }
      };

      socket.on("queue:position-update", handlePositionUpdate);
      socket.on("queue:call-time-update", handleCallTimeUpdate);
      socket.on("queue:status-change", handleStatusChange);

      socketCleanup = () => {
        socket.off("queue:position-update", handlePositionUpdate);
        socket.off("queue:call-time-update", handleCallTimeUpdate);
        socket.off("queue:status-change", handleStatusChange);
        leaveQueueRoom(bookingId);
      };
    });

    return () => {
      if (socketCleanup) {
        socketCleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, currentQueue?.bookingId, currentQueue?.status]);

  const handlePayment = async () => {
    if (!currentQueue?.invoice?._id) return;

    if (!confirm("Are you sure you want to process this payment?")) {
      return;
    }

    try {
      setIsProcessingPayment(true);
      const token = localStorage.getItem("medqueue_token");
      if (!token) {
        alert("Please login to process payment");
        return;
      }

      const response = await fetch(
        `/api/patient/invoices/${currentQueue.invoice._id}/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentMethod: "manual",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert("Payment processed successfully!");
        // Refresh queues to get updated invoice status
        await fetchQueues();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment? This action cannot be undone.")) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem("medqueue_token");
      if (!token) {
        alert("Please login to cancel booking");
        return;
      }

      const response = await fetch(`/api/patient/queue/${bookingId}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Appointment cancelled successfully");
        await fetchQueues();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const handleMarkComplete = async (bookingId: string) => {
    if (!confirm("Mark this appointment as completed? This will finalize your visit.")) {
      return;
    }

    try {
      const token = localStorage.getItem("medqueue_token");
      if (!token) {
        alert("Please login to mark appointment as complete");
        return;
      }

      const response = await fetch(`/api/patient/queue/${bookingId}/complete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        alert("Appointment marked as completed successfully");
        // Refresh queues to get updated status
        await fetchQueues();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to mark appointment as complete");
      }
    } catch (error) {
      console.error("Error marking appointment as complete:", error);
      alert("Failed to mark appointment as complete");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={!!user}
        userRole={user?.role}
        userName={user?.name}
        onLogout={logout}
      />

      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 lg:py-16 border-b border-border/50 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23000000' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" delay={0}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground flex items-center gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                    <ListOrdered className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    My Queue
                  </span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                  Monitor your queue position in real-time, manage appointments, and handle payments seamlessly. Everything you need for your visit is right here.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-4 flex-shrink-0">
                <Card className="px-5 py-4 bg-card/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
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
                </Card>
                <Card className="px-5 py-4 bg-card/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
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
                </Card>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

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
                  currentlyServing={queuePosition?.currentlyServing || currentQueue.queueNumber || ""}
                  patientsAhead={queuePosition?.patientsAhead ?? 0}
                  estimatedTime={queuePosition?.estimatedTime ?? 0}
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
                  onCancel={
                    currentQueue.status === "confirmed" || currentQueue.status === "in-progress"
                      ? () => handleCancelBooking(currentQueue.bookingId)
                      : undefined
                  }
                  onMarkComplete={
                    currentQueue.status === "in-progress"
                      ? () => handleMarkComplete(currentQueue.bookingId)
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

            <div className="space-y-8">
              {/* Patient Profile Card */}
              <Link href="/profile">
                <Card className="p-6 border border-border/50 shadow-xl bg-card/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-primary/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg ring-2 ring-primary/10">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Patient Profile</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 overflow-hidden shadow-xl ring-4 ring-primary/10 flex-shrink-0">
                        {patientProfile?.photoUrl ? (
                          <>
                            <Image
                              src={patientProfile.photoUrl}
                              alt={patientProfile.fullName || "Patient"}
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector(
                                    ".image-fallback"
                                  ) as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }
                              }}
                            />
                            <div className="image-fallback hidden w-full h-full items-center justify-center text-white font-bold text-2xl">
                              {patientProfile?.fullName?.charAt(0).toUpperCase() ||
                                user?.name?.charAt(0).toUpperCase() ||
                                "P"}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                            {patientProfile?.fullName?.charAt(0).toUpperCase() ||
                              user?.name?.charAt(0).toUpperCase() ||
                              "P"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-lg truncate mb-1">
                          {patientProfile?.fullName || user?.name || "Patient"}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize font-medium">
                          {patientProfile?.role || user?.role || "Patient"}
                        </p>
                      </div>
                    </div>
                    <div className="pt-5 border-t border-border/50 space-y-4">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-muted-foreground truncate font-medium">
                          {patientProfile?.email || user?.email || "patient@example.com"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-muted-foreground font-medium">
                          {patientProfile?.phoneNumber || "Not set"}
                        </span>
                      </div>
                      {patientProfile?.dateOfBirth && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-muted-foreground font-medium">
                            {new Date(patientProfile.dateOfBirth).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      {patientProfile?.gender && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                            <UserCircle className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-muted-foreground font-medium capitalize">
                            {patientProfile.gender}
                          </span>
                        </div>
                      )}
                      {patientProfile?.address && (
                        <div className="flex items-start gap-3 text-sm">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20 mt-0.5">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-muted-foreground font-medium line-clamp-2">
                            {patientProfile.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Invoice Card */}
              <Card className="p-6 bg-card/90 border border-border/50 shadow-sm mt-8">
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
                          onClick={handlePayment}
                          disabled={isProcessingPayment}
                        >
                          <CreditCard className="w-5 h-5" />
                          {isProcessingPayment ? "Processing..." : "Process Payment"}
                        </Button>
                      )}
                      {currentQueue.invoice.status === "paid" && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50/80 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-xl text-sm font-semibold border border-green-200/50 dark:border-green-800/50">
                          <CheckCircle2 className="w-4 h-4" />
                          Payment Completed
                        </div>
                      )}
                      {currentQueue.invoice && (
                        <Button
                          variant="outline"
                          className="w-full border-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                          onClick={() => {
                            router.push(
                              `/patient/invoices?bookingId=${currentQueue.bookingId}&status=${currentQueue.invoice?.status || "pending"}`
                            );
                          }}
                        >
                          <Receipt className="w-4 h-4 mr-2" />
                          View Invoice Details
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {selectedDoctor && (
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

                // Find the appointment that needs review
                const appointmentToReview = completedQueues.find(
                  (q) => q.doctor?.name === selectedDoctor && !q.hasReview
                );

                if (!appointmentToReview) {
                  alert("Appointment not found");
                  return;
                }

                const response = await fetch("/api/patient/reviews", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    bookingId: appointmentToReview.bookingId,
                    doctorId: appointmentToReview.doctor?._id,
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
                        {appointment.doctor?.rating && appointment.doctor.rating > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="text-base font-bold text-foreground">
                              {appointment.doctor.rating.toFixed(1)}
                            </span>
                            {appointment.doctor.totalReviews && appointment.doctor.totalReviews > 0 && (
                              <span className="text-sm text-muted-foreground">
                                ({appointment.doctor.totalReviews})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Action Buttons for Completed Appointments */}
                      {appointment.status === "completed" && (
                        <div className="pt-4 border-t border-border/50 space-y-2">
                          {!appointment.hasReview && appointment.invoice?.status === "paid" && (
                            <Button
                              onClick={() => {
                                setSelectedDoctor(appointment.doctor?.name || "");
                                setShowRatingModal(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full border-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 font-semibold gap-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Review Doctor
                            </Button>
                          )}
                          {appointment.hasMedicalRecord && (
                            <Button
                              onClick={() => router.push("/patient/medical-record")}
                              variant="outline"
                              size="sm"
                              className="w-full border-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 font-semibold gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              View Medical Record
                            </Button>
                          )}
                          {appointment.hasInvoice && (
                            <Button
                              onClick={() => {
                                router.push(
                                  `/patient/invoices?bookingId=${appointment.bookingId}&status=${appointment.invoice?.status || "pending"}`
                                );
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full border-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 font-semibold gap-2"
                            >
                              <Receipt className="w-4 h-4" />
                              View Invoice
                            </Button>
                          )}
                        </div>
                      )}
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
