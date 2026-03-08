export interface AreaAssignment {
  id: number; // For component compatibility
  _id: string; // MongoDB ObjectId
  area: string;
  salesmanId: number | string | null;
  salesman?: {
    _id: string;
    name: string;
    mobile: string;
  } | null;
  customerCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Salesman {
  id: number;
  _id?: string;
  name: string;
  mobile: string;
  address?: string;
  hireDate?: string;
  monthlySalary?: number;
  areasAssigned?: string[];
  customersAssigned?: number;
  totalSales?: number;
  totalCommission?: number;
  isActive?: boolean;
  notes?: string;
}

export interface Customer {
  id: number;
  _id?: string;
  name: string;
  address: string;
  mobile: string;
  area: string;
  salesmanId?: string | null;
  totalBalance?: number;
  totalBottlesPurchased?: number;
  deliveryFrequencyDays?: number;
  emptyBottlesHeld?: number;
  lastEmptiesCollectionDate?: string | null;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}