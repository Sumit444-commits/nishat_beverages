// FIX: Add missing React import to resolve 'Cannot find namespace React' error.
import React from 'react';

export const EXPENSE_CATEGORIES = [
    "Utilities",
    "Salaries",
    "Maintenance",
    "Fuel",
    "Marketing",
    "Rent",
    "Office Supplies",
    "Home",
    "Shop",
    "Miscellaneous",
];

export interface SalesmanAssignmentHistory {
    salesmanId: string | null;
    date: string; // ISO string format
}

export interface Customer {
    id: string;
    _id?: string;
    name: string;
    address: string;
    mobile: string;
    area: string;
    salesmanId?: string | null;
    salesmanName?: string | null;
    totalBalance: number;
    totalBottlesPurchased: number;
    deliveryFrequencyDays: number;
    emptyBottlesHeld: number;
    lastEmptiesCollectionDate?: string | null;
    salesmanAssignmentHistory?: Array<{
        salesmanId: string;
        date: string;
    }>;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Salesman {
    id: string;
    _id?: string;
    name: string;
    mobile: string;
    address?: string;
    hireDate: string;
    monthlySalary: number;
    areasAssigned: string[];
    customersAssigned: number;
    totalSales: number;
    totalCommission: number;
    isActive: boolean;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface AreaAssignment {
  id: number | string;
  _id?: string;
  area: string;
  salesmanId: number | string | null;
  customerCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
    id: number;
    customerId: number | null;
    salesmanId: number | null;
    inventoryItemId: number | null;
    quantity: number;
    emptiesCollected: number;
    amount: number;
    amountReceived: number;
    date: string; // ISO string format
    paymentMethod: 'Cash' | 'Bank' | 'Pending';
    description?: string;
    // FIX: Add missing 'paymentForCategory' property to the 'Sale' interface to resolve type errors in Dashboard.tsx.
    paymentForCategory?: '19Ltr Collection' | '6Ltr Collection';
}

export interface ExpenseOwner {
    id: number;
    name: string;
}

export interface Expense {
    id: number;
    date: string; // ISO string format
    category: string;
    name: string; // Formerly description
    description?: string; // Optional details
    amount: number;
    paymentMethod: 'Cash' | 'Bank';
    ownerId?: number | null;
    ownerType?: 'salesman' | 'owner' | null;
}

export interface InventoryItem {
    id: number;
    name: string;
    category: string;
    stock: number;
    unit: string;
    lowStockThreshold: number;
    sellingPrice: number;
}

export interface StockAdjustment {
    id: number;
    inventoryItemId: number;
    date: string; // ISO string format
    quantity: number; // can be positive or negative
    reason: string;
    newStockLevel: number;
}

export interface ClosingRecord {
    id: number;
    period: string;
    cashRevenue: number;
    bankRevenue: number;
    cashExpenses: number;
    bankExpenses: number;
    netBalance: number;
}

// FIX: Added SalesmanPayment interface to resolve import error in db/database.ts.
export interface SalesmanPayment {
    id: number;
    salesmanId: number;
    date: string; // ISO string format
    amount: number;
    paymentMethod: 'Cash' | 'Bank';
    notes?: string;
}

export interface DailyAssignment {
    id: number;
    salesmanId: number;
    date: string; // ISO string format
    bottlesAssigned: number;
    bottlesReturned: number | null; // Bottles not sold and returned to stock
}

export interface DailyOpeningBalance {
    date: string; // YYYY-MM-DD format
    cash: number;
    bank: number;
}

export interface DailyReminder {
    id: number;
    customerId: number;
    date: string; // ISO string format of when the reminder was sent
    message: string;
}

export interface CustomerDailySummary {
    customerId: number;
    customerName: string;
    customerMobile: string;
    date: string;
    bottlesPurchased: number;
    totalSaleAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    previousBalance: number;
    closingBalance: number;
    remainingEmpties: number;
}

export interface CounterUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    salt: string;
    createdAt: string;
    resetToken?: string;
    resetTokenExpires?: number;
}

export interface User {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    lastLogin?: string;
    createdAt?: string;
}

export interface Notification {
    id: number;
    title: string;
    description: string;
    date: string; // ISO String
    read: boolean;
}

export interface NavItem {
    name: string;
    // FIX: Changed icon type to `React.ReactElement<{ className?: string }>` to allow passing a className prop via `React.cloneElement`.
    icon: React.ReactElement<{ className?: string }>;
    type: 'link';
}

export interface NavSection {
    name: string;
    type: 'header';
}

export type SideNavItem = NavItem | NavSection;

export interface ClosingPeriodData {
    period: string;
    periodName?: string;
    cashRevenue: number;
    bankRevenue: number;
    totalRevenue?: number;
    cashExpenses: number;
    bankExpenses: number;
    totalExpenses?: number;
    netBalance: number;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    pagination?: {
        total: number;
        page: number;
        pages: number;
        limit: number;
    };
}