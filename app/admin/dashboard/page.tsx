"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Card } from "@/components/ui/card";
import { Users, Activity, Shield, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { OverviewTab } from "@/components/adminDashboard";
import { DoctorAdmin } from "@/types";

// Mock data
const STATS = {
  totalPatients: 128,
  avgWaitTime: "12 min",
  activeDoctors: 8,
  completedVisits: 342,
};

const DOCTORS: DoctorAdmin[] = [
  {
    _id: "675a3d4e8f1c2a3b4c5d6e7f" as unknown as DoctorAdmin["_id"],
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
    _id: "675a3d4e8f1c2a3b4c5d6e80" as unknown as DoctorAdmin["_id"],
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
    _id: "675a3d4e8f1c2a3b4c5d6e81" as unknown as DoctorAdmin["_id"],
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
    _id: "675a3d4e8f1c2a3b4c5d6e82" as unknown as DoctorAdmin["_id"],
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
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

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
              {(
                [
                  {
                    key: "overview",
                    label: "Overview",
                    path: "/admin/dashboard",
                    icon: Activity,
                  },
                  {
                    key: "doctors",
                    label: "Doctors",
                    path: "/admin/dashboard/doctors",
                    icon: Users,
                  },
                  {
                    key: "schedule",
                    label: "Schedule",
                    path: "/admin/dashboard/schedules",
                    icon: Calendar,
                  },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive =
                  pathname === tab.path ||
                  (tab.path === "/admin/dashboard" &&
                    pathname === "/admin/dashboard");
                return (
                  <button
                    key={tab.key}
                    onClick={() => router.push(tab.path)}
                    className={`px-5 py-3 rounded-lg font-semibold transition-all whitespace-nowrap capitalize flex items-center gap-2 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <OverviewTab stats={STATS} doctors={DOCTORS} />
      </main>
    </div>
  );
}
