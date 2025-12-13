"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminHeader, AdminTabs } from "@/components/adminDashboard";
import { DoctorAdmin } from "@/types/docterTypes";
import { OverviewTab } from "./OverviewTab";

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

      <AdminHeader
        title='Admin <span class="text-primary">Dashboard</span>'
        subtitle="Manage clinics, doctors, and patient support"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <AdminTabs />

        <OverviewTab stats={STATS} doctors={DOCTORS} />
      </main>
    </div>
  );
}
