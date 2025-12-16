import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";

import { Doctor } from "@/types/docterTypes";

export interface FindDoctorsFilter {
  q?: string;
  specialization?: string;
  isActive?: boolean;
}

export interface FindDoctorsOptions {
  page?: number;
  limit?: number;
  sort?: string; // e.g. "name_asc", "rating_desc"
}

//! escape regex input to avoid regex injection / invalid patterns
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default class DoctorModel {
  static async collection() {
    const db = await getDb();
    return db.collection("doctors");
  }

  static async getAllDoctors(): Promise<Doctor[]> {
    const collection = await this.collection();
    return collection.find({}).toArray() as unknown as Promise<Doctor[]>;
  }

  /**
   * Find doctors with filtering, pagination, and sorting
   * @param filter - Filter criteria (q, specialization, isActive)
   * @param options - Pagination and sorting options
   * @returns Array of doctors matching the criteria
   */
  static async findDoctors(
    filter: FindDoctorsFilter = {},
    options: FindDoctorsOptions = {}
  ): Promise<Doctor[]> {
    const collection = await this.collection();
    const query: Record<string, unknown> = {};

    // Default to active doctors for public access
    if (filter.isActive !== undefined) {
      query.$or = [
        { isActive: filter.isActive },
        ...(filter.isActive === true ? [{ isActive: { $exists: false } }] : []),
      ];
    } else {
      query.$or = [{ isActive: true }, { isActive: { $exists: false } }];
    }

    // Search keyword (q) - search in name, clinic, specialization
    if (filter.q && filter.q.trim()) {
      const safeQ = escapeRegex(filter.q.trim());
      const searchRegex = new RegExp(safeQ, "i");
      query.$or = [
        { name: searchRegex },
        { clinic: searchRegex },
        { specialization: searchRegex },
      ];
    }

    // Specialization filter (case-insensitive exact match)
    if (filter.specialization && filter.specialization.trim()) {
      const safeSpec = escapeRegex(filter.specialization.trim());
      query.specialization = new RegExp(`^${safeSpec}$`, "i");
    }

    // Pagination
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 12));
    const skip = (page - 1) * limit;

    // Sorting (whitelist fields to avoid odd requests)
    const allowedSortFields = new Set([
      "name",
      "averageRating",
      "totalReviews",
      "createdAt",
      "updatedAt",
    ]);

    let sortObj: Record<string, number> = { name: 1 }; // Default: name ascending
    if (options.sort) {
      const [field, direction] = options.sort.split("_");
      if (field && direction && allowedSortFields.has(field)) {
        sortObj = { [field]: direction === "desc" ? -1 : 1 };
      }
    }

    const doctors = await collection
      .find(query)
      .sort(sortObj as { [key: string]: 1 | -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return doctors as unknown as Doctor[];
  }

  /**
   * Count doctors matching the filter criteria
   * @param filter - Filter criteria (same as findDoctors)
   * @returns Total count of matching doctors
   */
  static async countDoctors(filter: FindDoctorsFilter = {}): Promise<number> {
    const collection = await this.collection();
    const query: Record<string, unknown> = {};

    if (filter.isActive !== undefined) {
      query.$or = [
        { isActive: filter.isActive },
        ...(filter.isActive === true ? [{ isActive: { $exists: false } }] : []),
      ];
    } else {
      query.$or = [{ isActive: true }, { isActive: { $exists: false } }];
    }

    if (filter.q && filter.q.trim()) {
      const safeQ = escapeRegex(filter.q.trim());
      const searchRegex = new RegExp(safeQ, "i");
      query.$or = [
        { name: searchRegex },
        { clinic: searchRegex },
        { specialization: searchRegex },
      ];
    }

    if (filter.specialization && filter.specialization.trim()) {
      const safeSpec = escapeRegex(filter.specialization.trim());
      query.specialization = new RegExp(`^${safeSpec}$`, "i");
    }

    return collection.countDocuments(query);
  }

  static async getDoctorById(doctorId: string): Promise<Doctor | null> {
    const collection = await this.collection();
    return collection.findOne({
      _id: new ObjectId(doctorId),
    }) as Promise<Doctor | null>;
  }

  static async create(doctorData: Doctor) {
    const collection = await this.collection();
    
    // Generate queueCode automatically if not provided
    if (!doctorData.queueCode) {
      // Count existing doctors to determine the next queueCode
      const doctorCount = await collection.countDocuments();
      
      // Generate queueCode based on alphabet index
      // A=0, B=1, C=2, ..., Z=25
      // If exceeds 26, use AA=26, AB=27, etc.
      const generateQueueCode = (index: number): string => {
        if (index < 26) {
          // Single letter: A-Z
          return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
        } else {
          // Double letter: AA, AB, AC, ..., AZ, BA, BB, etc.
          const firstLetter = String.fromCharCode(65 + Math.floor(index / 26) - 1);
          const secondLetter = String.fromCharCode(65 + (index % 26));
          return firstLetter + secondLetter;
        }
      };
      
      doctorData.queueCode = generateQueueCode(doctorCount);
    }
    
    doctorData = {
      ...doctorData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await collection.insertOne(doctorData as Omit<Doctor, "_id">);
      return doctorData;
    } catch (err) {
      throw err;
    }
  }

  static async update(doctorId: string, updateData: Partial<Doctor>) {
    updateData = {
      ...updateData,
      updatedAt: new Date(),
    };

    try {
      const collection = await this.collection();
      await collection.updateOne(
        { _id: new ObjectId(doctorId) },
        { $set: updateData }
      );
      return await this.getDoctorById(doctorId);
    } catch (err) {
      throw err;
    }
  }

  static async delete(doctorId: string) {
    try {
      const collection = await this.collection();
      await collection.deleteOne({ _id: new ObjectId(doctorId) });
      return true;
    } catch (err) {
      throw err;
    }
  }
}
