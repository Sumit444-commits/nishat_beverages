import { InventoryItem, CustomerDailySummary } from '../types';

// This file simulates making a call to a WhatsApp API service.
// In a real-world scenario, this would involve HTTP requests to a backend
// that securely handles the WhatsApp Business API credentials and logic.
// This implementation uses `wa.me` links to pre-fill messages for manual sending.

const ADMIN_PHONE_NUMBER = '923001234567'; // Replace with the admin's actual WhatsApp number

/**
 * Opens a pre-filled WhatsApp chat to send a low stock reminder.
 * @param item The inventory item that is low on stock.
 */
export const sendLowStockReminder = (item: InventoryItem): void => {
    const message = `*Low Stock Alert for Nishat Beverages*\n\n` +
                    `Item: *${item.name}*\n` +
                    `Category: ${item.category}\n` +
                    `Current Stock: *${item.stock}*\n\n` +
                    `Please reorder soon to avoid shortages.`;
    
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${ADMIN_PHONE_NUMBER}?text=${encodedMessage}`;

    console.log("--- GENERATING WHATSAPP URL ---");
    console.log(`To: ${ADMIN_PHONE_NUMBER}`);
    console.log(`Message: ${message}`);
    console.log("------------------------------------");

    window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Opens a pre-filled WhatsApp chat to send a daily summary reminder to a customer.
 * @param summary The calculated daily summary for the customer.
 * @returns The formatted message string that was generated.
 */
export const sendCustomerDailySummary = (summary: CustomerDailySummary): string => {
    const message = `*Nishat Beverages - Daily Summary*\n\n` +
                    `Date: *${new Date(summary.date).toLocaleDateString()}*\n` +
                    `Customer: *${summary.customerName}*\n\n` +
                    `-----------------------------------\n` +
                    `Previous Balance: PKR ${summary.previousBalance.toLocaleString()}\n` +
                    `Today's Bottles Purchased: ${summary.bottlesPurchased} (PKR ${summary.totalSaleAmount.toLocaleString()})\n` +
                    `Today's Paid Amount: PKR ${summary.paidAmount.toLocaleString()}\n` +
                    `Today's Unpaid Amount: PKR ${summary.unpaidAmount.toLocaleString()}\n` +
                    `-----------------------------------\n\n` +
                    `*New Total Balance: PKR ${summary.closingBalance.toLocaleString()}*\n` +
                    `*Remaining Empty Bottles: ${summary.remainingEmpties}*\n\n` +
                    `Thank you, Nishat Beverages.`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${summary.customerMobile.replace(/\D/g, '')}?text=${encodedMessage}`;

    console.log("--- GENERATING CUSTOMER WHATSAPP URL ---");
    console.log(`To: ${summary.customerMobile}`);
    console.log(`Message:\n${message}`);
    console.log("---------------------------------------------");
    
    window.open(url, '_blank', 'noopener,noreferrer');

    return message;
};


/**
 * Opens a pre-filled WhatsApp chat to send an on-demand account summary to a customer.
 * @returns The formatted message string that was generated.
 */
export const sendCustomerSummaryReminder = (
    mobile: string,
    name: string,
    balance: number,
    emptiesHeld: number,
    lastSaleDate: string
): string => {
    const message = `*Nishat Beverages - Account Summary*\n\n` +
                    `Hi ${name},\n\n` +
                    `Here is a summary of your account as of today:\n\n` +
                    `- Outstanding Balance: *PKR ${balance.toLocaleString()}*\n` +
                    `- Empty Bottles Held: *${emptiesHeld}*\n` +
                    `- Last Transaction: ${lastSaleDate}\n\n` +
                    `Thank you for your business!`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodedMessage}`;

    console.log("--- GENERATING CUSTOMER SUMMARY URL ---");
    console.log(`To: ${mobile}`);
    console.log(`Message:\n${message}`);
    console.log("---------------------------------------------");

    window.open(url, '_blank', 'noopener,noreferrer');

    return message;
};
