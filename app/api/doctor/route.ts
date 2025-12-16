import { NextResponse } from "next/server";
import DoctorModel, {
  FindDoctorsFilter,
  FindDoctorsOptions,
} from "@/db/models/Doctor";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Check for userId query - returns single doctor
    const userId = searchParams.get("userId");
    if (userId) {
      const doctor = await DoctorModel.getDoctorByUserId(userId);
      if (!doctor) {
        return NextResponse.json(
          { error: "Doctor not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ doctor }, { status: 200 });
    }

    // Extract query parameters
    const q = searchParams.get("q") || undefined;
    const specialization = searchParams.get("specialization") || undefined;
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const isActiveParam = searchParams.get("isActive");
    const sort = searchParams.get("sort") || undefined;

    // Parse pagination (clamp to match model)
    const page = Math.max(1, pageParam ? parseInt(pageParam, 10) : 1);
    const rawLimit = limitParam ? parseInt(limitParam, 10) : 12;
    const limit = Math.min(
      50,
      Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 12)
    );

    // Parse isActive (default to true for public access)
    let isActive: boolean | undefined = true;
    if (isActiveParam !== null) {
      isActive = isActiveParam === "true";
    }

    // Build filter
    const filter: FindDoctorsFilter = {};
    if (q) filter.q = q;
    if (specialization && specialization !== "All Specializations") {
      filter.specialization = specialization;
    }
    if (isActive !== undefined) filter.isActive = isActive;

    // Build options
    const options: FindDoctorsOptions = {
      page,
      limit,
    };
    if (sort) options.sort = sort;

    // Fetch doctors and total count
    const [doctors, total] = await Promise.all([
      DoctorModel.findDoctors(filter, options),
      DoctorModel.countDoctors(filter),
    ]);

    // Calculate pagination metadata (keep 0 when total=0)
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json(
      {
        doctors,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newDoctor = await DoctorModel.create(body);
    return NextResponse.json({ doctor: newDoctor }, { status: 201 });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updatedDoctor = await DoctorModel.update(
      body.doctorId,
      body.updateData
    );
    return NextResponse.json({ doctor: updatedDoctor }, { status: 200 });
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID is required" },
        { status: 400 }
      );
    }
    await DoctorModel.delete(doctorId);
    return NextResponse.json(
      { message: "Doctor deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return NextResponse.json(
      { error: "Failed to delete doctor" },
      { status: 500 }
    );
  }
}
