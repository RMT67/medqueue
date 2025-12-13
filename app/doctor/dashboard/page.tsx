"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { StatusBadge } from "@/components/status-badge";
import { AIInsightCard } from "@/components/ai-insight-card";
import { SessionTimer } from "@/components/session-timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Clock,
  CheckCircle2,
  SkipForward,
  Users,
  Activity,
  Stethoscope,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Doctor } from "@/types/docterTypes";

// Mock queue data (temporary until queue API is available)
const QUEUE_DATA = [
  {
    queueNo: "A-023",
    patientName: "John Smith",
    status: "being-served",
    eta: "In progress",
    timeRange: "09:00 - 12:00",
    patientComplaint:
      "Experiencing persistent headaches for the past week, especially in the morning. Also feeling fatigued.",
  },
  {
    queueNo: "A-024",
    patientName: "Emma Wilson",
    status: "waiting",
    eta: "5 min",
    timeRange: "09:00 - 12:00",
    patientComplaint:
      "Chest pain and shortness of breath during physical activities.",
  },
  {
    queueNo: "A-025",
    patientName: "Michael Brown",
    status: "waiting",
    eta: "12 min",
    timeRange: "09:00 - 12:00",
    patientComplaint: "Persistent cough and sore throat for 3 days.",
  },
  {
    queueNo: "A-026",
    patientName: "Sarah Davis",
    status: "waiting",
    eta: "18 min",
    timeRange: "09:00 - 12:00",
    patientComplaint:
      "Lower back pain that started after lifting heavy objects.",
  },
];

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(QUEUE_DATA[0]);
  const [queue, setQueue] = useState(QUEUE_DATA.slice(1));
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "doctor")) {
      router.push("/login/doctor");
    }
  }, [user, isLoading, router]);

  // Fetch doctor data for clinic info
  useEffect(() => {
    async function fetchDoctors() {
      if (!user || user.role !== "doctor") {
        setDoctorLoading(false);
        return;
      }

      try {
        setDoctorLoading(true);
        setDoctorError(null);
        const response = await apiFetch<{ doctors: Doctor[] }, void>(
          "/api/doctor",
          {
            method: "GET",
            skipAuth: true,
          }
        );
        setDoctors(response.doctors || []);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setDoctorError(
          err instanceof Error ? err.message : "Gagal memuat data dokter"
        );
        setDoctors([]); // Ensure empty array on error
      } finally {
        setDoctorLoading(false);
      }
    }

    fetchDoctors();
  }, [user]);

  if (isLoading || doctorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get current doctor info from fetched data (logged-in doctor)
  const currentDoctor = doctors.find((d) => d.userId === user._id);

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleCallNext = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setCurrentPatient(next);
      setQueue(queue.slice(1));
    }
  };

  const handleSkip = () => {
    console.log("Patient skipped");
  };

  const handleFinish = () => {
    setIsSessionActive(false);
    handleCallNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="doctor"
        userName={user.name}
        onLogout={logout}
      />

      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/5 py-8 lg:py-10 border-b border-border overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23000000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Stethoscope className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                Doctor <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage your patient queue and sessions
              </p>
            </div>
            <Card className="p-4 md:p-5 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {user.name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">
                    {user.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentDoctor?.specialization || "Dokter"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Error State */}
        {doctorError && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <div className="p-6 flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Gagal memuat data dokter</p>
                <p className="text-sm">{doctorError}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!doctorError && doctors.length === 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <div className="p-12 text-center">
              <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold text-foreground mb-2">
                Belum ada data dokter
              </p>
              <p className="text-muted-foreground">
                Data dokter belum tersedia di database.
              </p>
            </div>
          </Card>
        )}

        {/* Main Content - Only render if doctor data exists */}
        {!doctorError && doctors.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Area - Current Patient */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Patient Card - Mock Data (until queue API available) */}
              <Card className="p-6 lg:p-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm border-dashed border-yellow-400/30">
                <div className="mb-4 pb-4 border-b border-yellow-400/20">
                  <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                    ⚠️ Data Antrian (Mock - API belum tersedia)
                  </p>
                </div>
                <div className="text-center mb-6 pb-6 border-b-2 border-primary/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Currently Serving
                  </p>
                  <h2 className="text-5xl lg:text-6xl font-bold text-primary font-mono mb-2">
                    {currentPatient.queueNo}
                  </h2>
                  <p className="text-lg font-semibold text-foreground">
                    {currentPatient.patientName}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-5 mb-6 border-2 border-border space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Patient Information
                    </p>
                    <p className="text-base font-semibold text-foreground">
                      {currentPatient.patientName}
                    </p>
                  </div>
                  <div className="pt-4 border-t-2 border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Available Time
                    </p>
                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                      <Clock className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold text-primary">
                        {currentPatient.timeRange}
                      </p>
                    </div>
                  </div>
                  {currentPatient.patientComplaint && (
                    <div className="pt-4 border-t-2 border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Patient Complaint
                      </p>
                      <div className="flex items-start gap-2 p-3 bg-card/50 rounded-lg border border-border">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {currentPatient.patientComplaint}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t-2 border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Status
                    </p>
                    <StatusBadge status="being-served" />
                  </div>
                </div>

                {/* Session Timer */}
                <Card className="p-6 mb-6 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20 shadow-lg">
                  <SessionTimer duration={600} />
                </Card>

                {/* Action Buttons */}
                {!isSessionActive ? (
                  <div className="space-y-3">
                    <Button
                      onClick={handleStartSession}
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg hover:shadow-xl transition-all font-medium"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Start Session
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="w-full h-12 border-2 hover:bg-muted hover:border-primary/30 transition-all gap-2 font-medium"
                    >
                      <SkipForward className="w-5 h-5" />
                      Skip Patient
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      className="flex-1 h-12 border-2 hover:bg-muted hover:border-primary/30 transition-all font-medium"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleFinish}
                      className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-all font-medium"
                    >
                      Finish & Call Next
                    </Button>
                  </div>
                )}
              </Card>

              {/* Today's Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-5 lg:p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Patients Today
                      </p>
                      <p className="text-2xl lg:text-3xl font-bold text-foreground">
                        24
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5 lg:p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-md">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Avg Service Time
                      </p>
                      <p className="text-2xl lg:text-3xl font-bold text-foreground">
                        7 min
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Today's Queue Table - Mock Data */}
              <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm border-dashed border-yellow-400/30">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">
                      Today&apos;s Queue
                    </h3>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Mock data (API belum tersedia)
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {queue.length > 0 ? (
                    queue.map((patient, idx) => (
                      <Card
                        key={idx}
                        className="p-4 border-2 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer bg-card/80 backdrop-blur-sm"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-foreground text-base">
                                {patient.queueNo}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {patient.patientName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> {patient.eta}
                              </p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-border space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <p className="text-xs font-semibold text-primary">
                                {patient.timeRange}
                              </p>
                            </div>
                            {patient.patientComplaint && (
                              <div className="flex items-start gap-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {patient.patientComplaint}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground text-sm">
                        No more patients today
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* AI Insights */}
              <AIInsightCard
                title="Performance Insights"
                insights={[
                  "Average service: 7 minutes",
                  "On schedule today",
                  "Patient satisfaction: 4.8/5",
                ]}
                recommendation="Keep up the pace! You're doing great."
              />

              {/* Clinic Info */}
              <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center shadow-md">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Clinic Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Clinic
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {currentDoctor?.clinic || "N/A"}
                    </p>
                  </div>
                  {currentDoctor?.defaultSchedule && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Available Time
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {currentDoctor.defaultSchedule}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Location
                    </p>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Tidak tersedia
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
