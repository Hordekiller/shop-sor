export type Role = "SUPER_ADMIN" | "ADMIN" | "VENDOR" | "CUSTOMER";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  sku?: string;
  stock: number;
  type: "simple" | "variable" | "digital" | "external";
  isActive: boolean;
  images: string[];
  categoryId: number;
  shopId?: number;
  category?: Category;
  shop?: Shop;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  sortOrder: number;
  children?: Category[];
}

export interface Shop {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  commission: number;
  ownerId: number;
  owner?: User;
}

export interface Order {
  id: number;
  orderNumber: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  userId: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  total: number;
  productId: number;
  product?: Product;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  isApproved: boolean;
  userId: number;
  productId: number;
  user?: User;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface Address {
  id: number;
  province: string;
  city: string;
  district?: string;
  street: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export * from "./page-builder";
