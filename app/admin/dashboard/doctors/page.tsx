"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  AdminHeader,
  AdminTabs,
  AdminProtectedRoute,
} from "@/components/adminDashboard";
import { DoctorAdmin, Doctor } from "@/types/docterTypes";
import { DoctorsTab } from "./DoctorsTab";
import Swal from "sweetalert2";

// Fungsi untuk mapping Doctor ke DoctorAdmin
const mapDoctorToAdmin = (doctor: Doctor): DoctorAdmin => {
  return {
    _id: doctor._id,
    name: doctor.name,
    specialization: doctor.specialization,
    clinic: doctor.clinic,
    status: doctor.isActive ? "online" : "offline",
    todayPatients: 0,
    currentQueue: 0,
    currentlyServing: null,
    avgWaitTime: 0,
    completedToday: 0,
    image: doctor.image,
    timeStatus: "onTime",
  };
};

export default function DoctorsPage() {
  const { user, logout } = useAuth();
  const [doctors, setDoctors] = useState<DoctorAdmin[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoadingDoctors(true);
        const response = await fetch("/api/doctor");
        if (!response.ok) {
          throw new Error("Failed to fetch doctors");
        }
        const data = await response.json();
        const mappedDoctors = (data.doctors || []).map((doctor: Doctor) =>
          mapDoctorToAdmin(doctor)
        );
        setDoctors(mappedDoctors);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    if (user?.role === "admin") {
      fetchDoctors();
    }
  }, [user]);

  const handleDeleteDoctor = async (doctorId: string) => {
    const result = await Swal.fire({
      title: "Delete Doctor?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/doctor/${doctorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete doctor");
      }

      // Refresh the doctors list
      setDoctors((prevDoctors) =>
        prevDoctors.filter((doctor) => doctor._id.toString() !== doctorId)
      );

      Swal.fire({
        title: "Deleted!",
        text: "Doctor has been deleted successfully.",
        icon: "success",
        confirmButtonColor: "#10b981",
      });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to delete doctor. Please try again.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <AdminProtectedRoute
      loadingComponent={
        isLoadingDoctors ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading doctors...</p>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navigation
          isAuthenticated={true}
          userRole="admin"
          userName={user?.name || "Admin"}
          onLogout={logout}
        />

        <AdminHeader
          title='Manage <span class="text-primary">Doctors</span>'
          subtitle="View and manage all doctors in the system"
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <AdminTabs />

          <DoctorsTab doctors={doctors} onDeleteDoctor={handleDeleteDoctor} />
        </main>
      </div>
    </AdminProtectedRoute>
  );
}
