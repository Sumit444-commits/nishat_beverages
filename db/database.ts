import { Customer, Salesman, Sale, Expense, InventoryItem, StockAdjustment, DailyAssignment, ExpenseOwner, SalesmanPayment, DailyOpeningBalance, DailyReminder, ClosingRecord, AreaAssignment } from '../types';

const DB_KEY = 'ro_plant_database';

interface Database {
    customers: Customer[];
    salesmen: Salesman[];
    sales: Sale[];
    expenses: Expense[];
    inventory: InventoryItem[];
    stockAdjustments: StockAdjustment[];
    dailyAssignments: DailyAssignment[];
    expenseOwners: ExpenseOwner[];
    salesmanPayments: SalesmanPayment[];
    dailyOpeningBalances: DailyOpeningBalance[];
    dailyReminders: DailyReminder[];
    closingRecords: ClosingRecord[];
    areaAssignments: AreaAssignment[];
}

const getInitialData = (): Database => {
    // Return a completely empty database.
    return {
        customers: [],
        salesmen: [],
        sales: [],
        expenses: [],
        inventory: [],
        stockAdjustments: [],
        dailyAssignments: [],
        expenseOwners: [],
        salesmanPayments: [],
        dailyOpeningBalances: [],
        dailyReminders: [],
        closingRecords: [],
        areaAssignments: [],
    };
};

export const getDatabase = (): Database => {
    const dbString = localStorage.getItem(DB_KEY);
    if (dbString) {
        try {
            const db = JSON.parse(dbString);
            // Basic schema check, if a new field is missing, regenerate
            if (!db.dailyReminders) {
                 throw new Error("Old database schema detected (missing dailyReminders).");
            }
            if (!db.dailyOpeningBalances) {
                 throw new Error("Old database schema detected (missing dailyOpeningBalances).");
            }
            if (!db.salesmanPayments) {
                 throw new Error("Old database schema detected (missing salesmanPayments).");
            }
             if (!db.closingRecords) {
                db.closingRecords = [];
            }
            if (!db.areaAssignments) {
                db.areaAssignments = [];
            }
            // Migrate existing customers to have area field if missing
            if (db.customers && db.customers.length > 0 && !db.customers[0].area) {
                db.customers = db.customers.map((c: Customer) => ({
                    ...c,
                    area: '' // Initialize with empty area
                }));
            }
            if (db.sales && db.sales.length > 0 && typeof db.sales[0].customerId !== 'object') { // A simple check for the nullable customerId change. typeof null is 'object'.
                const isNullable = db.sales.some((s: Sale) => s.customerId === null);
                if (!isNullable) { // If no sales have a null customerId, it might be an old schema
                    const hasCounterSales = db.sales.some((s: Sale) => !s.customerId);
                    if (!hasCounterSales) { // Check for truthy/falsy
                        // This check is imperfect, but better than nothing.
                        // A more robust solution is DB versioning.
                    }
                }
            }

            return db;
        } catch (e) {
            console.warn("Failed to parse database or old schema detected, re-initializing.", e);
            const initialData = getInitialData();
            localStorage.setItem(DB_KEY, JSON.stringify(initialData));
            return initialData;
        }
    } else {
        const initialData = getInitialData();
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
        return initialData;
    }
};

export const saveDatabase = (db: Database) => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
};