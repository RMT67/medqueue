"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  Clock,
  Activity,
  Plus,
  Edit2,
  Trash2,
  Shield,
  CheckCircle2,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Mock data
const STATS = {
  totalPatients: 128,
  avgWaitTime: "12 min",
  activeDoctors: 8,
  completedVisits: 342,
};

const DOCTORS = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    clinic: "Central Health Clinic",
    status: "online",
    todayPatients: 12,
    currentQueue: 5,
    currentlyServing: "A-021",
    avgWaitTime: 12,
    completedToday: 7,
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    timeStatus: "onTime", // "onTime" | number (late minutes)
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialization: "Cardiologist",
    clinic: "Heart Care Medical Center",
    status: "online",
    todayPatients: 8,
    currentQueue: 3,
    currentlyServing: "B-015",
    avgWaitTime: 18,
    completedToday: 5,
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    timeStatus: 5, // 5 minutes late
  },
  {
    id: "3",
    name: "Dr. Priya Patel",
    specialization: "Pediatrician",
    clinic: "Kids Wellness Clinic",
    status: "offline",
    todayPatients: 0,
    currentQueue: 0,
    currentlyServing: null,
    avgWaitTime: 0,
    completedToday: 0,
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    timeStatus: "onTime",
  },
  {
    id: "4",
    name: "Dr. James Wilson",
    specialization: "Dermatologist",
    clinic: "Skin Care Specialists",
    status: "online",
    todayPatients: 6,
    currentQueue: 2,
    currentlyServing: "C-008",
    avgWaitTime: 10,
    completedToday: 4,
    image:
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    timeStatus: "onTime",
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "doctors" | "schedule"
  >("overview");
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="admin"
        userName={user.name}
        onLogout={logout}
      />

      {/* Hero Header */}
      <section className="relative bg-linear-to-br from-primary/10 via-accent/5 to-secondary/5 py-8 lg:py-10 border-b border-border overflow-hidden">
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
                <Shield className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                Admin <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage clinics, doctors, and patient support
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Tabs */}
        <div className="mb-6 lg:mb-8">
          <Card className="p-2 border-2 shadow-lg bg-card/80 backdrop-blur-sm">
            <div className="flex gap-2 overflow-x-auto">
              {(["overview", "doctors", "schedule"] as const).map((tab) => {
                const icons = {
                  overview: Activity,
                  doctors: Users,
                  schedule: Calendar,
                };
                const Icon = icons[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 rounded-lg font-semibold transition-all whitespace-nowrap capitalize flex items-center gap-2 ${
                      activeTab === tab
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Total Patients Today
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-foreground">
                  {STATS.totalPatients}
                </p>
              </Card>

              <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Avg Wait Time
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent to-secondary flex items-center justify-center shadow-md">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-foreground">
                  {STATS.avgWaitTime}
                </p>
              </Card>

              <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Active Doctors
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-secondary to-primary flex items-center justify-center shadow-md">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-foreground">
                  {STATS.activeDoctors}
                </p>
              </Card>

              <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Completed Visits
                  </p>
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-foreground">
                  {STATS.completedVisits}
                </p>
              </Card>
            </div>

            {/* Active Doctors with Schedule */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Active Doctors & Queue Status
                </h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {DOCTORS.filter((doctor) => doctor.status === "online").map(
                  (doctor) => {
                    const initials = doctor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase();

                    const isOnTime = doctor.timeStatus === "onTime";
                    const lateMinutes =
                      typeof doctor.timeStatus === "number"
                        ? doctor.timeStatus
                        : 0;

                    return (
                      <Card
                        key={doctor.id}
                        className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all"
                      >
                        {/* Doctor Header */}
                        <div className="flex items-center gap-4 mb-5">
                          {/* Doctor Photo */}
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/20 shrink-0 shadow-md">
                            {doctor.image ? (
                              <>
                                <Image
                                  src={doctor.image}
                                  alt={doctor.name}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const fallback = parent.querySelector(
                                        ".image-fallback"
                                      ) as HTMLElement;
                                      if (fallback)
                                        fallback.style.display = "flex";
                                    }
                                  }}
                                />
                                <div className="image-fallback hidden w-full h-full items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-xl">
                                  {initials}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-xl">
                                {initials}
                              </div>
                            )}
                          </div>

                          {/* Doctor Info */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-foreground text-lg mb-1 truncate">
                                  {doctor.name}
                                </h4>
                                <p className="text-sm text-muted-foreground font-medium mb-1">
                                  {doctor.specialization}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doctor.clinic}
                                </p>
                              </div>
                            </div>

                            {/* Time Status */}
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${
                                isOnTime
                                  ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              }`}
                            >
                              {isOnTime ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Tepat Waktu</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Telat {lateMinutes} menit</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Queue Information */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-muted/50 rounded-lg border border-border">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                Queue
                              </p>
                              <p className="text-2xl font-bold text-primary">
                                {doctor.currentQueue}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                patients waiting
                              </p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-lg border-2 border-primary/20">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                Serving
                              </p>
                              <p className="text-2xl font-bold text-primary">
                                {doctor.currentlyServing || "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                current patient
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-muted/50 rounded-lg border border-border">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                Avg Wait
                              </p>
                              <p className="text-xl font-bold text-foreground">
                                {doctor.avgWaitTime} min
                              </p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg border border-border">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                Completed
                              </p>
                              <p className="text-xl font-bold text-foreground">
                                {doctor.completedToday}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                today
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-border">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Total Today
                              </p>
                              <p className="text-lg font-bold text-foreground">
                                {doctor.todayPatients} patients
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <Card className="p-6 lg:p-8 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent to-secondary flex items-center justify-center shadow-md">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Recent Activity
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  "Dr. Sarah Johnson started session at 09:15",
                  "New patient booking for Dr. Michael Chen",
                  "Dr. Priya Patel went offline",
                  "Patient A-042 completed consultation",
                  "System alert: High queue at Central Clinic",
                ].map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-3 px-4 bg-muted/50 rounded-lg border-2 border-border hover:bg-muted hover:border-primary/30 transition-all"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-foreground font-medium">
                      {activity}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === "doctors" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Manage Doctors
                </h2>
              </div>
              <Button
                onClick={() => setShowAddDoctorModal(true)}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all h-11"
              >
                <Plus className="w-5 h-5" />
                Add Doctor
              </Button>
            </div>

            <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm overflow-x-auto">
              <div className="min-w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-primary/20 bg-linear-to-r from-primary/5 to-accent/5">
                      <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                        Name
                      </th>
                      <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                        Specialization
                      </th>
                      <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                        Clinic
                      </th>
                      <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                        Today&apos;s Patients
                      </th>
                      <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DOCTORS.map((doctor) => (
                      <tr
                        key={doctor.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="font-bold text-foreground">
                            {doctor.name}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground font-medium">
                          {doctor.specialization}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground font-medium">
                          {doctor.clinic}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${
                              doctor.status === "online"
                                ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 border-green-200 dark:border-green-800"
                                : "bg-gray-50 text-gray-700 dark:bg-gray-950/50 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                doctor.status === "online"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            />
                            {doctor.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-foreground">
                            {doctor.todayPatients}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              className="p-2 hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20"
                              title="Edit Doctor"
                            >
                              <Edit2 className="w-4 h-4 text-primary" />
                            </button>
                            <button
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800"
                              title="Delete Doctor"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Doctor Schedules
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {DOCTORS.map((doctor) => (
                <Card
                  key={doctor.id}
                  className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all"
                >
                  <div className="flex justify-between items-start mb-5 pb-5 border-b-2 border-border">
                    <div>
                      <h3 className="font-bold text-foreground text-xl mb-1">
                        {doctor.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        {doctor.specialization}
                      </p>
                    </div>
                    <button
                      className="p-2 hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20 hover:scale-105"
                      title="Edit Schedule"
                    >
                      <Edit2 className="w-5 h-5 text-primary" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-linear-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Monday - Friday
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        09:00 - 17:00
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        1 hour lunch break at 12:00
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border-2 border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                        Saturday
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        09:00 - 13:00
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl border-2 border-border">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                        Sunday
                      </p>
                      <p className="text-sm font-bold text-muted-foreground">
                        Closed
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-8 lg:p-10 border-2 shadow-2xl space-y-6 bg-card/95 backdrop-blur-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-accent mb-4 shadow-lg">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Add New Doctor
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Dr. John Doe"
                  className="h-11 border-2 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Specialization
                </label>
                <select className="w-full h-11 px-4 bg-input border-2 border-border rounded-lg text-foreground focus:border-primary transition-colors">
                  <option>Select specialization</option>
                  <option>General Practitioner</option>
                  <option>Cardiologist</option>
                  <option>Dermatologist</option>
                  <option>Pediatrician</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Clinic
                </label>
                <Input
                  type="text"
                  placeholder="Clinic name"
                  className="h-11 border-2 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  License Number
                </label>
                <Input
                  type="text"
                  placeholder="License number"
                  className="h-11 border-2 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDoctorModal(false)}
                className="flex-1 h-12 border-2 hover:bg-muted transition-colors"
              >
                Cancel
              </Button>
              <Button className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                Add Doctor
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
