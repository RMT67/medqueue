export type Service = {
  _id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ServiceCategory =
  | "Consultation"
  | "Laboratory"
  | "Radiology"
  | "Procedure"
  | "Emergency"
  | "Other";
