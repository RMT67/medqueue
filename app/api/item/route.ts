import MedicineModel from "@/db/models/Medicine";
import { NextResponse } from "next/server";

interface MedicineFormType {
  name: string;
  category: string;
  description: string;
  stock: number;
  minStock: number;
  price: number;
  unit: string;
  imageUrl: string;
  manufacturer: string;
  expiryDate: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  try {
    const medicines = await MedicineModel.getAll(search);
    return NextResponse.json(
      { message: "Success", data: medicines },
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

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const res = await MedicineModel.create(body as MedicineFormType);
    return NextResponse.json(
      { message: "Medicine created successfully", data: res },
      { status: 201 }
    );
  } catch (err) {
    console.log("🚀 ~ POST ~ err:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
