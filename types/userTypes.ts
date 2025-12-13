export type UserRole = "admin" | "doctor" | "patient";
export type UserGender = "male" | "female";

export interface UserPublic {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  photoUrl?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null; // ISO date string
  gender?: UserGender | null;
  address?: string | null;
  isActive?: boolean;
}

export interface ProfileUser extends UserPublic {}

// For /api/auth/me response (uses "name" instead of "fullName" for backward compatibility)
export interface AuthMeUser {
  _id: string;
  name: string; // This is mapped from fullName
  email: string;
  role: UserRole;
  photoUrl?: string | null;
}

