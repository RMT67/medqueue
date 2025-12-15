export interface Service {
  _id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
