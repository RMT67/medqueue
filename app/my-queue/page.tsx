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
import { StatusBadge } from "@/components/status-badge";
import Swal from "sweetalert2";

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
  const [patientProfile, setPatientProfile] = useState<ProfileUser | null>(
    null
  );
  const [queuePosition, setQueuePosition] = useState<{
    patientsAhead: number;
    estimatedTime: number;
    currentlyServing: string;
    estimatedCallTime?: string;
    estimatedCallTimeTimestamp?: Date | string;
    averageServiceTime?: number;
  } | null>(null);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Countdown timer state
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

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
          Authorization: token,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("[my-queue page] ====== API RESPONSE RECEIVED ======");
        console.log("[my-queue page] Total queues:", data.queues?.length);

        // Log ALL queues, not just F-007
        data.queues?.forEach((q: QueueItem, index: number) => {
          console.log(`[my-queue page] Queue ${index + 1}:`, {
            bookingId: q.bookingId,
            queueNumber: q.queueNumber,
            bookingNumber: q.bookingNumber,
            appointmentTime: q.appointmentTime,
            appointmentTimeType: typeof q.appointmentTime,
            timeRange: q.timeRange,
            scheduleDate: q.scheduleDate,
          });
          if (q.appointmentTime) {
            try {
              const testDate = new Date(q.appointmentTime);
              console.log(
                `[my-queue page] Queue ${index + 1} appointmentTime parsed:`,
                {
                  iso: testDate.toISOString(),
                  local: testDate.toString(),
                  hours: testDate.getHours(),
                  minutes: testDate.getMinutes(),
                  formatted: `${testDate
                    .getHours()
                    .toString()
                    .padStart(2, "0")}:${testDate
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`,
                }
              );
            } catch (e) {
              console.error(
                `[my-queue page] Error parsing appointmentTime for queue ${
                  index + 1
                }:`,
                e
              );
            }
          } else {
            console.warn(
              `[my-queue page] ⚠️ Queue ${
                index + 1
              } appointmentTime is NULL or UNDEFINED!`
            );
          }
        });

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
          Authorization: token,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.bookingId === bookingId) {
          setQueuePosition({
            patientsAhead: data.patientsAhead || 0,
            estimatedTime: data.estimatedTime || 0,
            currentlyServing: data.currentlyServing || "",
            estimatedCallTime: data.estimatedCallTime,
            estimatedCallTimeTimestamp: data.estimatedCallTimeTimestamp,
            averageServiceTime: data.averageServiceTime,
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

  // Filter active queues (confirmed or in-progress)
  const activeQueues = useMemo(
    () =>
      queues.filter(
        (q) => q.status === "confirmed" || q.status === "in-progress"
      ),
    [queues]
  );

  // Get current active queue (first active queue)
  const currentQueue = useMemo(() => {
    return activeQueues[0] || null;
  }, [activeQueues]);

  // Cancelled appointments
  const cancelledQueues = useMemo(
    () => queues.filter((q) => q.status === "cancelled"),
    [queues]
  );

  // Past appointments: completed, atau appointmentTime sudah lewat (tapi bukan yang masih active atau cancelled)
  // Ini untuk counter "Completed" - hanya completed, bukan cancelled
  const completedQueues = useMemo(
    () =>
      queues.filter((q) => {
        // Exclude active queues (confirmed or in-progress) - mereka tidak termasuk completed
        if (q.status === "confirmed" || q.status === "in-progress") {
          return false;
        }
        // Exclude cancelled queues - mereka punya counter sendiri
        if (q.status === "cancelled") {
          return false;
        }
        // Past appointments: completed, atau appointmentTime sudah lewat
        if (q.status === "completed") {
          return true;
        }
        // Jika appointmentTime sudah lewat, juga termasuk sebagai past (tapi bukan yang masih active atau cancelled)
        if (q.appointmentTime) {
          const appointmentDate = new Date(q.appointmentTime);
          const now = new Date();
          return appointmentDate < now;
        }
        return false;
      }),
    [queues]
  );

  // Past appointments untuk display: semua status past (completed, cancelled, atau appointmentTime sudah lewat)
  // Tapi exclude yang masih active (confirmed/in-progress)
  const pastAppointments = useMemo(
    () =>
      queues.filter((q) => {
        // Exclude active queues (confirmed or in-progress) - mereka tidak termasuk past
        if (q.status === "confirmed" || q.status === "in-progress") {
          return false;
        }
        // Include completed dan cancelled
        if (q.status === "completed" || q.status === "cancelled") {
          return true;
        }
        // Jika appointmentTime sudah lewat, juga termasuk sebagai past
        if (q.appointmentTime) {
          const appointmentDate = new Date(q.appointmentTime);
          const now = new Date();
          return appointmentDate < now;
        }
        return false;
      }),
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

  // Countdown timer effect
  useEffect(() => {
    if (
      !queuePosition?.estimatedCallTimeTimestamp ||
      currentQueue?.status === "completed"
    ) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const timestamp = queuePosition.estimatedCallTimeTimestamp;
      if (!timestamp) {
        setCountdown(null);
        return;
      }

      const callTime =
        timestamp instanceof Date ? timestamp : new Date(timestamp);
      const now = new Date();
      const diff = callTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
      });
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [queuePosition?.estimatedCallTimeTimestamp, currentQueue?.status]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (
      !user ||
      user.role !== "patient" ||
      !currentQueue ||
      currentQueue.status === "completed"
    ) {
      return;
    }

    let socketCleanup: (() => void) | null = null;
    const bookingId = currentQueue.bookingId;

    // Dynamic import untuk client-side only
    import("@/lib/socket-client").then(
      ({ getSocket, joinQueueRoom, leaveQueueRoom }) => {
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
        // NOTE: estimatedCallTime dari socket adalah untuk countdown timer, BUKAN untuk Call Time display
        // Call Time display menggunakan appointmentTime dari booking (tidak terpengaruh socket)
        const handleCallTimeUpdate = (data: {
          bookingId: string;
          estimatedCallTime: string;
          estimatedCallTimeTimestamp: string;
          patientsAhead: number;
          estimatedTime: number;
          averageServiceTime?: number;
        }) => {
          if (data.bookingId === bookingId) {
            console.log("[my-queue page] Socket call-time-update received:", {
              estimatedCallTime: data.estimatedCallTime,
              bookingId: data.bookingId,
            });
            // NOTE: estimatedCallTime ini hanya untuk countdown timer, TIDAK mengubah appointmentTime
            setQueuePosition((prev) => ({
              patientsAhead: data.patientsAhead,
              estimatedTime: data.estimatedTime,
              currentlyServing: prev?.currentlyServing || "",
              estimatedCallTime: data.estimatedCallTime,
              estimatedCallTimeTimestamp: data.estimatedCallTimeTimestamp,
              averageServiceTime:
                data.averageServiceTime || prev?.averageServiceTime,
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
            console.log(
              "[my-queue page] Socket status-change received, refreshing queues:",
              {
                queueStatus: data.queueStatus,
                bookingId: data.bookingId,
              }
            );
            // Refresh queues when status changes (ini akan fetch ulang dari API, appointmentTime tetap dari booking)
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
      }
    );

    return () => {
      if (socketCleanup) {
        socketCleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, currentQueue?.bookingId, currentQueue?.status]);

  const handlePayment = async () => {
    if (!currentQueue?.invoice?._id) return;

    const result = await Swal.fire({
      icon: "question",
      title: "Process Payment?",
      text: "Are you sure you want to process this payment?",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, process it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

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
        await Swal.fire({
          icon: "success",
          title: "Payment Successful!",
          text: "Payment processed successfully!",
          confirmButtonColor: "#10b981",
        });
        // Refresh queues to get updated invoice status
        await fetchQueues();
      } else {
        const error = await response.json();
        await Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: error.error || "Failed to process payment",
          confirmButtonColor: "#ef4444",
        });
      }
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

  const handleCancelBooking = async (bookingId: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Cancel Appointment?",
      text: "Are you sure you want to cancel this appointment? This action cannot be undone.",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No, keep it",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem("medqueue_token");
      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "Authentication Required",
          text: "Please login to cancel booking",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }

      // Validate bookingId
      if (!bookingId) {
        await Swal.fire({
          icon: "error",
          title: "Invalid Booking",
          text: "Invalid booking ID",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      const response = await fetch(`/api/patient/queue/${bookingId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          cancelReason: "Cancelled by patient from my queue page",
        }),
      });

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Appointment Cancelled",
          text: "Appointment cancelled successfully",
          confirmButtonColor: "#10b981",
        });
        await fetchQueues();
      } else {
        const error = await response.json();
        await Swal.fire({
          icon: "error",
          title: "Cancellation Failed",
          text: error.error || "Failed to cancel appointment",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to cancel appointment",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setCancellingId(null);
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
                  Monitor your queue position in real-time, manage appointments,
                  and handle payments seamlessly. Everything you need for your
                  visit is right here.
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
                <Card className="px-5 py-4 bg-card/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/10 flex items-center justify-center ring-2 ring-red-200/50 dark:ring-red-800/20">
                      <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">
                        Cancelled
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {cancelledQueues.length}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Countdown Timer Section */}
      {currentQueue && currentQueue.status !== "completed" && (
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-8 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {countdown && !countdown.isExpired ? (
              <FadeIn direction="up" delay={0.1}>
                <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20 shadow-lg">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                        <Clock className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                          Estimated Call Time
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {queuePosition?.estimatedCallTime || "Calculating..."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {countdown.days > 0 && (
                        <div className="text-center">
                          <div className="text-4xl md:text-5xl font-bold text-primary mb-1">
                            {countdown.days.toString().padStart(2, "0")}
                          </div>
                          <div className="text-xs text-muted-foreground font-semibold uppercase">
                            Days
                          </div>
                        </div>
                      )}
                      {countdown.days > 0 || countdown.hours > 0 ? (
                        <div className="text-center">
                          <div className="text-4xl md:text-5xl font-bold text-primary mb-1">
                            {countdown.hours.toString().padStart(2, "0")}
                          </div>
                          <div className="text-xs text-muted-foreground font-semibold uppercase">
                            Hours
                          </div>
                        </div>
                      ) : null}
                      <div className="text-center">
                        <div className="text-4xl md:text-5xl font-bold text-primary mb-1">
                          {countdown.minutes.toString().padStart(2, "0")}
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase">
                          Minutes
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl md:text-5xl font-bold text-primary mb-1">
                          {countdown.seconds.toString().padStart(2, "0")}
                        </div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase">
                          Seconds
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            ) : countdown?.isExpired ? (
              <FadeIn direction="up" delay={0.1}>
                <Card className="p-6 bg-gradient-to-br from-green-50/80 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-2 border-green-200/50 dark:border-green-800/50 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg ring-4 ring-green-200/50">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">
                        It's Your Turn!
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Please proceed to the consultation room.
                      </p>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            ) : null}
          </div>
        </section>
      )}

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
        ) : !currentQueue || activeQueues.length === 0 ? (
          <FadeIn direction="up" delay={0}>
            <Card className="border border-border/50 p-12 lg:p-16 text-center shadow-xl bg-card/95 backdrop-blur-sm">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-primary/10">
                  <ListOrdered className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4">
                  No Active Bookings Yet
                </h3>
                <p className="text-muted-foreground mb-8 leading-relaxed text-base">
                  You don't have any active appointments in queue. Book a doctor
                  to see your queue, track your appointment status, and manage
                  invoices here.
                </p>
                <Button
                  onClick={() => router.push("/doctors")}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                >
                  <ArrowRight className="w-5 h-5" />
                  Find Doctor
                </Button>
              </div>
            </Card>
          </FadeIn>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            <div className="lg:col-span-2 space-y-6">
              {currentQueue && (
                <QueueCard
                  currentlyServing={
                    queuePosition?.currentlyServing ||
                    currentQueue.queueNumber ||
                    ""
                  }
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
                  estimatedCallTime={queuePosition?.estimatedCallTime}
                  averageServiceTime={queuePosition?.averageServiceTime}
                  hasMedicalRecord={currentQueue.hasMedicalRecord}
                  hasInvoice={currentQueue.hasInvoice}
                  invoiceStatus={currentQueue.invoice?.status}
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
                    currentQueue.status === "confirmed" ||
                    currentQueue.status === "in-progress"
                      ? () => handleCancelBooking(currentQueue.bookingId)
                      : undefined
                  }
                  onViewMedicalRecord={
                    currentQueue.hasMedicalRecord
                      ? () => router.push("/patient/medical-record")
                      : undefined
                  }
                  onViewInvoice={
                    currentQueue.hasInvoice
                      ? () => {
                          router.push(
                            `/patient/invoices?bookingId=${
                              currentQueue.bookingId
                            }&status=${
                              currentQueue.invoice?.status || "pending"
                            }`
                          );
                        }
                      : undefined
                  }
                />
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
                    <h3 className="text-lg font-bold text-foreground">
                      Patient Profile
                    </h3>
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
                              {patientProfile?.fullName
                                ?.charAt(0)
                                .toUpperCase() ||
                                user?.name?.charAt(0).toUpperCase() ||
                                "P"}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                            {patientProfile?.fullName
                              ?.charAt(0)
                              .toUpperCase() ||
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
                          {patientProfile?.email ||
                            user?.email ||
                            "patient@example.com"}
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
                            {new Date(
                              patientProfile.dateOfBirth
                            ).toLocaleDateString("id-ID", {
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
                          {isProcessingPayment
                            ? "Processing..."
                            : "Process Payment"}
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
                              `/patient/invoices?bookingId=${
                                currentQueue.bookingId
                              }&status=${
                                currentQueue.invoice?.status || "pending"
                              }`
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
                  await Swal.fire({
                    icon: "error",
                    title: "Appointment Not Found",
                    text: "Appointment not found",
                    confirmButtonColor: "#ef4444",
                  });
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
                  await Swal.fire({
                    icon: "error",
                    title: "Review Failed",
                    text: error.error || "Failed to submit review",
                    confirmButtonColor: "#ef4444",
                  });
                }
              } catch (error) {
                console.error("Error submitting review:", error);
                await Swal.fire({
                  icon: "error",
                  title: "Error",
                  text: "Failed to submit review",
                  confirmButtonColor: "#ef4444",
                });
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
            {pastAppointments.length > 0 ? (
              pastAppointments.slice(0, 3).map((appointment) => {
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
                        <div className="flex flex-col gap-2">
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
                          <StatusBadge
                            status={
                              appointment.status === "cancelled"
                                ? "cancelled"
                                : appointment.status === "completed"
                                ? "completed"
                                : "confirmed"
                            }
                          />
                        </div>
                        {appointment.doctor?.rating &&
                          appointment.doctor.rating > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                              <span className="text-base font-bold text-foreground">
                                {appointment.doctor.rating.toFixed(1)}
                              </span>
                              {appointment.doctor.totalReviews &&
                                appointment.doctor.totalReviews > 0 && (
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
                          {!appointment.hasReview &&
                            appointment.invoice?.status === "paid" && (
                              <Button
                                onClick={() => {
                                  setSelectedDoctor(
                                    appointment.doctor?.name || ""
                                  );
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
                              onClick={() =>
                                router.push("/patient/medical-record")
                              }
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
                                  `/patient/invoices?bookingId=${
                                    appointment.bookingId
                                  }&status=${
                                    appointment.invoice?.status || "pending"
                                  }`
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
