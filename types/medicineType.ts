export interface MedicineType {
  _id: string;
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
