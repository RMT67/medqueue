"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  ArrowLeft,
  Calendar,
  MapPin,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { ProfileUser } from "@/types/userTypes";

export default function EditProfilePage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "" as "male" | "female" | "",
    address: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await apiFetch<{ user: ProfileUser }>("/api/profile");
        setFormData({
          fullName: data.user.fullName,
          phoneNumber: data.user.phoneNumber || "",
          dateOfBirth: data.user.dateOfBirth || "",
          gender: data.user.gender || "",
          address: data.user.address || "",
        });
        setProfileImage(data.user.photoUrl ?? null);
        setError(null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      fetchProfile();
    }
  }, [authUser]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Jika tidak ada file, return
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Set uploading state
    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    // Create preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const token = localStorage.getItem("medqueue_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Create FormData and append file
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      // Upload to /api/profile/photo
      const response = await fetch("/api/profile/photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload photo");
      }

      const data = (await response.json()) as { user: ProfileUser };

      // Update preview avatar dengan photoUrl dari response
      setProfileImage(data.user.photoUrl ?? null);

      // Update localStorage "medqueue_user" agar navbar/avatar ikut berubah
      const savedUser = localStorage.getItem("medqueue_user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          const updatedUser = {
            ...userData,
            name: data.user.fullName,
            fullName: data.user.fullName,
            photoUrl: data.user.photoUrl,
          };
          localStorage.setItem("medqueue_user", JSON.stringify(updatedUser));

          // Trigger custom event to update auth context
          window.dispatchEvent(new Event("medqueue_user_updated"));
        } catch (e) {
          console.error("Error updating localStorage:", e);
        }
      }

      setSuccessMessage("Photo uploaded successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reset file input untuk allow re-select same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Upload photo error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload photo");
      // Reset preview jika error
      setProfileImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updateData: Record<string, unknown> = {
        fullName: formData.fullName.trim(),
      };

      // Phone number
      if (formData.phoneNumber.trim()) {
        updateData.phoneNumber = formData.phoneNumber.trim();
      } else {
        updateData.phoneNumber = null;
      }

      // Date of birth
      if (formData.dateOfBirth && formData.dateOfBirth.trim()) {
        updateData.dateOfBirth = formData.dateOfBirth;
      } else {
        updateData.dateOfBirth = null;
      }

      // Gender
      if (
        formData.gender &&
        (formData.gender === "male" || formData.gender === "female")
      ) {
        updateData.gender = formData.gender;
      } else {
        updateData.gender = null;
      }

      // Address
      if (formData.address.trim()) {
        updateData.address = formData.address.trim();
      } else {
        updateData.address = null;
      }

      console.log("Sending update data:", updateData);

      const data = await apiFetch<{ user: ProfileUser }>("/api/profile", {
        method: "PATCH",
        body: updateData,
      });

      console.log("Update response:", data);

      // Update localStorage medqueue_user
      const savedUser = localStorage.getItem("medqueue_user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          const updatedUser = {
            ...userData,
            name: data.user.fullName,
            fullName: data.user.fullName,
            photoUrl: data.user.photoUrl,
            phoneNumber: data.user.phoneNumber,
          };
          localStorage.setItem("medqueue_user", JSON.stringify(updatedUser));

          // Trigger custom event to update auth context
          window.dispatchEvent(new Event("medqueue_user_updated"));
        } catch (e) {
          console.error("Error updating localStorage:", e);
        }
      }

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      console.error("Update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const initials = formData.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navigation />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4 border-2 hover:bg-muted transition-colors gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Edit Profile
                </h1>
                <p className="text-muted-foreground text-base">
                  Update your personal information
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-300 font-semibold">
                {error}
              </p>
            </Card>
          )}

          {/* Success Message */}
          {successMessage && (
            <Card className="p-4 mb-6 bg-green-50 dark:bg-green-950/50 border-2 border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-300 font-semibold">
                {successMessage}
              </p>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Section */}
            <Card className="p-6 lg:p-8 border-2 shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Profile Photo
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent overflow-hidden shadow-lg">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" />
                      Upload Photo (Image File)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full border-2 hover:bg-muted transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Choose Photo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isUploading
                        ? "Uploading your photo..."
                        : "Select an image file to upload automatically"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card className="p-6 lg:p-8 border-2 shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Personal Information
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="h-12 border-2 focus:border-primary transition-colors"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={authUser?.email || ""}
                    className="h-12 border-2 bg-muted cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                    className="h-12 border-2 focus:border-primary transition-colors"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="h-12 border-2 focus:border-primary transition-colors"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-primary" />
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as "male" | "female" | "",
                      })
                    }
                    className="flex h-12 w-full rounded-md border-2 border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    disabled={isSaving}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Address
                  </label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Enter your address"
                    className="min-h-24 border-2 focus:border-primary transition-colors"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 h-12 border-2 hover:bg-muted transition-colors"
                disabled={isSaving || isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isUploading}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
