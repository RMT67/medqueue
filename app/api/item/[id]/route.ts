import MedicineModel from "@/db/models/Medicine";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const medicine = await MedicineModel.getById(id);

    if (!medicine) {
      return NextResponse.json(
        { message: "Medicine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Success", data: medicine },
      { status: 200 }
    );
  } catch (err) {
    console.log("🚀 ~ GET ~ err:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    delete body._id;

    const updatedMedicine = await MedicineModel.update(id, body);

    if (!updatedMedicine) {
      return NextResponse.json(
        { message: "Medicine not found or not updated" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Medicine updated successfully", data: updatedMedicine },
      { status: 200 }
    );
  } catch (err) {
    console.log("🚀 ~ PUT ~ err:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isDeleted = await MedicineModel.delete(id);

    if (!isDeleted) {
      return NextResponse.json(
        { message: "Medicine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Medicine deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.log("🚀 ~ DELETE ~ err:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
