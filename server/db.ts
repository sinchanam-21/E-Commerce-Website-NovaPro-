import crypto from 'crypto';
import { allProducts } from '../src/data';

export interface DBProduct {
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

export interface DBReview {
  _id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DBUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: string;
  phone?: string;
  storeName?: string;
  bio?: string;
  address?: string;
  securityNotificationEmail?: string;
  emailAlertsEnabled?: boolean;
}

export interface DBSecurityAlert {
  _id: string;
  userId: string;
  email: string;
  eventType: 'LOGIN_SUCCESS' | 'PASSWORD_CHANGED' | 'PROFILE_UPDATED' | 'EMAIL_CHANGED' | 'TEST_ALERT' | 'PASSWORD_RESET_ALERT';
  title: string;
  message: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED';
  securityCode: string;
}

export interface DBOrder {
  _id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  orderItems: {
    productId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
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

// In-Memory & Document Collections matching MongoDB schema
class MongoCollection<T extends { _id: string }> {
  private items: Map<string, T> = new Map();

  constructor(initialData: T[] = []) {
    initialData.forEach((item) => this.items.set(item._id, { ...item }));
  }

  async find(filter?: (item: T) => boolean): Promise<T[]> {
    const all = Array.from(this.items.values());
    if (!filter) return all;
    return all.filter(filter);
  }

  async findOne(filter: (item: T) => boolean): Promise<T | null> {
    for (const item of this.items.values()) {
      if (filter(item)) return { ...item };
    }
    return null;
  }

  async findById(id: string): Promise<T | null> {
    const item = this.items.get(id);
    return item ? { ...item } : null;
  }

  async insertOne(doc: Omit<T, '_id'> & { _id?: string }): Promise<T> {
    const _id = doc._id || crypto.randomBytes(12).toString('hex');
    const fullDoc = { ...doc, _id } as T;
    this.items.set(_id, fullDoc);
    return { ...fullDoc };
  }

  async updateOne(id: string, update: Partial<T>): Promise<T | null> {
    const existing = this.items.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...update, _id: id };
    this.items.set(id, updated);
    return { ...updated };
  }

  async deleteOne(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  async count(): Promise<number> {
    return this.items.size;
  }
}

// Initial Seed Products (10 items per category across 9 categories = 90 products)
const initialProducts: DBProduct[] = allProducts;

// Initial Reviews Seed
const initialReviews: DBReview[] = [
  {
    _id: '66a2001e7b8f10214c000001',
    productId: '66a1001e7b8f10214c000031',
    userName: 'David Miller',
    rating: 5,
    comment: 'The noise cancellation blew my expectations away during a transatlantic flight. Bass is punchy without distorting vocals. Highly recommended!',
    createdAt: new Date('2026-02-10').toISOString(),
  },
  {
    _id: '66a2001e7b8f10214c000002',
    productId: '66a1001e7b8f10214c000031',
    userName: 'Sarah Jenkins',
    rating: 5,
    comment: 'Battery life truly lasts all week on a single charge. Seamless switching between my MacBook and phone is flawless.',
    createdAt: new Date('2026-02-14').toISOString(),
  },
  {
    _id: '66a2001e7b8f10214c000003',
    productId: '66a1001e7b8f10214c000071',
    userName: 'Alex Wong',
    rating: 5,
    comment: 'The titanium body feels premium and durable. GPS accuracy during my trail runs matches dedicated handheld units.',
    createdAt: new Date('2026-02-18').toISOString(),
  },
  {
    _id: '66a2001e7b8f10214c000004',
    productId: '66a1001e7b8f10214c000021',
    userName: 'Elena Rostova',
    rating: 5,
    comment: 'The typing feel is deep and creamy straight out of the box. Keycaps feel sturdy and RGB illumination is crisp.',
    createdAt: new Date('2026-02-22').toISOString(),
  },
];

// Initial demo user: john@example.com / password123 (SHA-256 hash)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const initialUsers: DBUser[] = [
  {
    _id: '66a3001e7b8f10214c000001',
    name: 'John Doe',
    email: 'john@example.com',
    passwordHash: hashPassword('password123'),
    isAdmin: false,
    createdAt: new Date('2026-01-01').toISOString(),
  },
  {
    _id: '66a3001e7b8f10214c000099',
    name: 'Store Owner',
    email: 'oreooreooreo9@gmail.com',
    passwordHash: hashPassword('admin123'),
    isAdmin: true,
    createdAt: new Date('2026-01-01').toISOString(),
    phone: '+1 (555) 839-2041',
    storeName: 'NovaStore Official Flagship',
    bio: 'Official flagship store owner and inventory administrator.',
    address: 'Suite 400, Commerce Tower, Tech District',
    securityNotificationEmail: 'oreooreooreo9@gmail.com',
    emailAlertsEnabled: true,
  },
];

const initialSecurityAlerts: DBSecurityAlert[] = [
  {
    _id: 'sec_alert_001',
    userId: '66a3001e7b8f10214c000099',
    email: 'oreooreooreo9@gmail.com',
    eventType: 'LOGIN_SUCCESS',
    title: 'Owner Security Monitoring Activated',
    message: 'Store Owner account security monitoring active for oreooreooreo9@gmail.com with live email dispatches.',
    ipAddress: '192.168.1.1 (Authenticated Terminal)',
    userAgent: 'Chrome / Verified Desktop Client',
    timestamp: new Date('2026-09-10T05:00:00Z').toISOString(),
    status: 'DELIVERED',
    securityCode: 'SEC-89241',
  },
];

// Initialize Collections
export const productsCollection = new MongoCollection<DBProduct>(initialProducts);
export const reviewsCollection = new MongoCollection<DBReview>(initialReviews);
export const usersCollection = new MongoCollection<DBUser>(initialUsers);
export const ordersCollection = new MongoCollection<DBOrder>([]);
export const securityAlertsCollection = new MongoCollection<DBSecurityAlert>(initialSecurityAlerts);

export { hashPassword };
