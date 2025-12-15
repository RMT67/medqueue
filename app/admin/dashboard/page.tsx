"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminHeader, AdminTabs } from "@/components/adminDashboard";
import { DoctorAdmin } from "@/types/docterTypes";
import { OverviewTab } from "./OverviewTab";

interface DashboardStats {
  totalPatients: number;
  avgWaitTime: string;
  activeDoctors: number;
  completedVisits: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    avgWaitTime: "0 min",
    activeDoctors: 0,
    completedVisits: 0,
  });
  const [doctors, setDoctors] = useState<DoctorAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch doctors data
      const doctorsResponse = await fetch("/api/doctor");
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();

        // Ensure doctorsData is an array
        const doctorsArray = Array.isArray(doctorsData) ? doctorsData : [];
        setDoctors(doctorsArray);

        // Calculate stats from doctors data
        const activeDocs = doctorsArray.filter(
          (d: DoctorAdmin) => d.status === "online"
        );
        const totalPatients = activeDocs.reduce(
          (sum: number, d: DoctorAdmin) => sum + (d.todayPatients || 0),
          0
        );
        const completedVisits = activeDocs.reduce(
          (sum: number, d: DoctorAdmin) => sum + (d.completedToday || 0),
          0
        );
        const avgWait =
          activeDocs.length > 0
            ? Math.round(
                activeDocs.reduce(
                  (sum: number, d: DoctorAdmin) => sum + (d.avgWaitTime || 0),
                  0
                ) / activeDocs.length
              )
            : 0;

        setStats({
          totalPatients,
          avgWaitTime: `${avgWait} min`,
          activeDoctors: activeDocs.length,
          completedVisits,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-liniaer-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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

        <OverviewTab stats={stats} doctors={doctors} />
      </main>
    </div>
  );
}
