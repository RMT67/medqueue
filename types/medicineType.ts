export interface MedicineType {
  _id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  stock: number;
  minStock: number;
  price: number;
  currency: string;
  unit: string;
  packaging: {
    unitPerPack: number;
    packUnit: string;
    packPrice: number;
  };
  imageUrl: string;
  manufacturer: string;
  expiryDate: string;
  isActive: boolean;
}

export interface MedicineFormType {
  code: string;
  name: string;
  category: string;
  description: string;
  stock: number;
  minStock: number;
  price: number;
  currency: string;
  unit: string;
  packaging: {
    unitPerPack: number;
    packUnit: string;
    packPrice: number;
  };
  imageUrl: string;
  manufacturer: string;
  expiryDate: string;
  isActive: boolean;
}
