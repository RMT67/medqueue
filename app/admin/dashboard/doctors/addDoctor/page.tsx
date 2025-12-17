"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AdminHeader, AdminTabs } from "@/components/adminDashboard";
// import Image from "next/image";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";

interface RegisterResponseUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface RegisterResponse {
  user: RegisterResponseUser;
}

export default function AddDoctorPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    clinic: "",
    image: "",
    isActive: true,
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/login/admin");
    }
  }, [user, authLoading, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      isActive: e.target.checked,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      // Step 1: Create User first using apiFetch helper
      const userData = await apiFetch<
        RegisterResponse,
        { name: string; email: string; password: string; role: string }
      >("/api/register", {
        method: "POST",
        body: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "doctor",
        },
      });

      console.log("User created:", userData);
      const userId = userData.user._id;

      // Step 2: Create Doctor with userId from the new user
      const doctorData = {
        userId: userId,
        name: formData.name,
        specialization: formData.specialization,
        clinic: formData.clinic,
        image: formData.image || "",
        isActive: formData.isActive,
        averageRating: 0,
        totalReviews: 0,
        defaultSchedule: "",
      };

      console.log("Creating doctor with data:", doctorData);

      const doctorResponse = await fetch(`/api/doctor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(doctorData),
      });

      const doctorResult = await doctorResponse.json();

      if (!doctorResponse.ok) {
        console.error("Doctor creation failed:", doctorResult);
        throw new Error(doctorResult.error || "Failed to add doctor");
      }

      console.log("Doctor created:", doctorResult);

      await Swal.fire({
        title: "Success!",
        text: "Doctor and user account created successfully!",
        icon: "success",
        confirmButtonColor: "#10b981",
      });

      router.push("/admin/dashboard/doctors");
    } catch (error) {
      console.error("Error adding doctor:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add doctor";
      setErrorMsg(errorMessage);
      Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="admin"
        userName={user?.name || "Admin"}
        onLogout={logout}
      />

      <AdminHeader
        title='Add New <span class="text-primary">Doctor</span>'
        subtitle="Register a new doctor in the system"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <AdminTabs />

        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/dashboard/doctors")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Doctors
          </Button>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Add Form */}
        <Card className="p-6 lg:p-8 border-2 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Dr. John Doe"
                  className="h-11 border-2 focus:border-primary"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="doctor@example.com"
                  className="h-11 border-2 focus:border-primary"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="h-11 border-2 focus:border-primary"
                  required
                  minLength={6}
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full h-11 px-4 bg-input border-2 border-border rounded-lg text-foreground focus:border-primary transition-colors"
                  required
                >
                  <option value="">Select specialization</option>
                  <option value="General Practitioner">
                    General Practitioner
                  </option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Orthopedist">Orthopedist</option>
                  <option value="Psychiatrist">Psychiatrist</option>
                  <option value="Ophthalmologist">Ophthalmologist</option>
                </select>
              </div>

              {/* Clinic */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Clinic <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="clinic"
                  value={formData.clinic}
                  onChange={handleInputChange}
                  placeholder="Clinic name"
                  className="h-11 border-2 focus:border-primary"
                  required
                />
              </div>

              {/* Image URL */}
              {/* <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Image URL
                </label>
                <Input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="h-11 border-2 focus:border-primary"
                />
              </div> */}

              {/* Active Status */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 text-primary bg-input border-2 border-border rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    Active Status (Doctor available for appointments)
                  </span>
                </label>
              </div>
            </div>

            {/* Image Preview */}
            {/* {formData.image && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Image Preview
                </label>
                <Image
                  src={formData.image}
                  alt="Doctor preview"
                  className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/150?text=No+Image";
                  }}
                  width={128}
                  height={128}
                />
              </div>
            )} */}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/dashboard/doctors")}
                className="flex-1 h-12 border-2 hover:bg-muted transition-colors"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Add Doctor
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
