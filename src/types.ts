export interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating: number;
  numReviews: number;
  inStock: boolean;
  countInStock: number;
  image: string;
  images: string[];
  description: string;
  features: string[];
  specs: Record<string, string>;
  badge?: 'Bestseller' | 'New' | 'Sale' | 'Trending';
  createdAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  token?: string;
  phone?: string;
  storeName?: string;
  bio?: string;
  address?: string;
  securityNotificationEmail?: string;
  emailAlertsEnabled?: boolean;
}

export interface SecurityAlert {
  _id: string;
  userId?: string;
  email: string;
  eventType: 'LOGIN_SUCCESS' | 'PASSWORD_CHANGED' | 'PROFILE_UPDATED' | 'EMAIL_CHANGED' | 'TEST_ALERT';
  title: string;
  message: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED';
  securityCode: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: 'standard' | 'express';
  paymentMethod: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  discountPrice: number;
  totalPrice: number;
  isPaid: boolean;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  estimatedDelivery: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export type ViewMode = 'catalog' | 'product-detail' | 'checkout' | 'order-success';

export type Currency = 'USD' | 'INR';
