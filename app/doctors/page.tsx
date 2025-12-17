import DoctorModel from "@/db/models/Doctor";
import { FindDoctorsFilter } from "@/db/models/Doctor";
import DoctorsPageClient from "./DoctorsPageClient";

interface DoctorRaw {
  _id: { toString: () => string } | string;
  name: string;
  specialization: string;
  clinic: string;
  image?: string;
  averageRating?: number;
  totalReviews: number;
  consultationFee?: number;
  defaultSchedule?: string;
  isActive?: boolean;
}

type SafeDoctor = {
  id: string;
  _id: string;
  name: string;
  specialization: string;
  clinic: string;
  image?: string;
  averageRating: number;
  totalReviews: number;
  consultationFee?: number;
  defaultSchedule?: string;
  isActive?: boolean;
};

type DoctorsPageProps = {
  searchParams: {
    q?: string;
    specialization?: string;
    page?: string;
    limit?: string;
    sort?: string;
    isActive?: string;
  };
};

export const revalidate = 0;

export default async function DoctorsPage({ searchParams }: DoctorsPageProps) {
  const q = searchParams.q || "";
  const specialization =
    searchParams.specialization || "All Specializations";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const rawLimit = Number(searchParams.limit) || 12;
  const limit = Math.min(50, Math.max(1, rawLimit));
  const sort = searchParams.sort;
  const isActive =
    searchParams.isActive !== undefined
      ? searchParams.isActive === "true"
      : true;

  const filter: FindDoctorsFilter = {};
  if (q.trim()) filter.q = q.trim();
  if (specialization && specialization !== "All Specializations") {
    filter.specialization = specialization;
  }
  if (isActive !== undefined) filter.isActive = isActive;

  const [doctorsRaw, total] = await Promise.all([
    DoctorModel.findDoctors(filter, { page, limit, sort }),
    DoctorModel.countDoctors(filter),
  ]);

  const doctors: SafeDoctor[] = doctorsRaw.map((doc) => {
    const docData = doc as unknown as DoctorRaw;
    const id = typeof docData._id === 'string' 
      ? docData._id 
      : docData._id?.toString() || '';
    return {
      id,
      _id: id,
      name: docData.name,
      specialization: docData.specialization,
      clinic: docData.clinic,
      image: docData.image,
      averageRating: docData.averageRating || 0,
      totalReviews: docData.totalReviews,
      consultationFee: docData.consultationFee,
      defaultSchedule: docData.defaultSchedule,
      isActive: docData.isActive,
    };
  });

  const meta = {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };

  const uniqueSpecs = Array.from(
    new Set(doctors.map((d) => d.specialization).filter(Boolean))
  );
  const specializations = ["All Specializations", ...uniqueSpecs];

  return (
    <DoctorsPageClient
      doctors={doctors}
      meta={meta}
      initialSearchTerm={q}
      initialSpecialization={specialization}
      specializations={specializations}
      limit={limit}
    />
  );
}
