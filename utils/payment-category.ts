import { InventoryItem, Sale } from '../types';

const NINETEEN_LTR_REGEX = /19\s*(ltr|liter|litre)/i;
const SIX_LTR_REGEX = /6\s*(ltr|liter|litre)/i;

export const is19LItemName = (name?: string) => !!name && NINETEEN_LTR_REGEX.test(name);
export const is6LItemName = (name?: string) => !!name && SIX_LTR_REGEX.test(name);

export const inferPaymentCategoryFromInventory = (
    inventory: InventoryItem[],
    inventoryItemId: number | null | undefined,
    amountReceived: number | undefined,
    existingCategory?: Sale['paymentForCategory']
): Sale['paymentForCategory'] | undefined => {
    if (existingCategory || !inventoryItemId || !amountReceived || amountReceived <= 0) {
        return existingCategory;
    }

    const matchedItem = inventory.find(item => item.id === inventoryItemId);
    if (!matchedItem) {
        return existingCategory;
    }

    if (is19LItemName(matchedItem.name)) {
        return '19Ltr Collection';
    }

    if (is6LItemName(matchedItem.name)) {
        return '6Ltr Collection';
    }

    return existingCategory;
};

