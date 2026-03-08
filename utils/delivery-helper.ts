import { Customer, Sale } from '../types';

/**
 * Checks if a customer's delivery is due today.
 * @param customer The customer object.
 * @param sales An array of all sales records.
 * @returns boolean indicating if delivery is due.
 */
export const isDeliveryDue = (customer: Customer, sales: Sale[]): boolean => {
    return isDeliveryDueOn(new Date(), customer, sales);
};

/**
 * Checks if a customer's delivery is due on a specific date.
 * @param date The date to check against.
 * @param customer The customer object.
 * @param sales An array of all sales records.
 * @returns boolean indicating if delivery is due on the given date.
 */
export const isDeliveryDueOn = (date: Date, customer: Customer, sales: Sale[]): boolean => {
    // Customers with a frequency of 0 or less are considered on-demand
    if (!customer.deliveryFrequencyDays || customer.deliveryFrequencyDays <= 0) {
        return false;
    }

    const customerSales = sales
        .filter(s => s.customerId === customer.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // If a customer has never had a sale, assume they are due for a first delivery
    if (customerSales.length === 0) {
        return true;
    }

    const lastSaleDate = new Date(customerSales[0].date);
    const targetDate = new Date(date);
    
    // Normalize dates to midnight to compare days correctly
    lastSaleDate.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const timeDifference = targetDate.getTime() - lastSaleDate.getTime();
    const dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    // Delivery is due if the number of days passed is equal to or greater than their frequency
    return dayDifference >= customer.deliveryFrequencyDays;
};
