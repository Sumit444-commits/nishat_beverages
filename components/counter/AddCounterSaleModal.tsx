import React, { useState, useEffect } from 'react';
import { Sale, InventoryItem } from '../../types';

interface AddCounterSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSale: (sale: Omit<Sale, 'id' | 'customerId'>) => void;
    inventory: InventoryItem[];
}

const AddCounterSaleModal: React.FC<AddCounterSaleModalProps> = ({ isOpen, onClose, onAddSale, inventory }) => {
    const [selectedInventoryItemId, setSelectedInventoryItemId] = useState(''); // 'manual' or item.id
    const [quantity, setQuantity] = useState(1);
    const [manualAmount, setManualAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank'>('Cash');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

    const selectedItem = inventory.find(i => i.id === Number(selectedInventoryItemId));
    const isManualEntry = selectedInventoryItemId === 'manual';
    const amount = isManualEntry ? Number(manualAmount) : (selectedItem?.sellingPrice || 0) * quantity;

    useEffect(() => {
        if (isOpen) {
            setSelectedInventoryItemId('');
            setQuantity(1);
            setManualAmount('');
            setPaymentMethod('Cash');
            setSaleDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedInventoryItemId) {
            alert("Please select an item or choose manual entry.");
            return;
        }

        if (isManualEntry && (amount <= 0)) {
            alert("Please enter a valid amount for manual sale.");
            return;
        }

        const newSale: Omit<Sale, 'id' | 'customerId'> = {
            salesmanId: null,
            inventoryItemId: isManualEntry ? null : Number(selectedInventoryItemId),
            quantity: isManualEntry ? 0 : quantity,
            emptiesCollected: 0,
            amount: amount,
            amountReceived: amount, // Counter sales are paid immediately
            date: new Date(saleDate).toISOString(),
            paymentMethod: paymentMethod,
            description: isManualEntry ? 'Manual Sale' : undefined,
        };
        onAddSale(newSale);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-brand-text-primary">Add Counter Sale</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="counter-sale-date" className="block text-sm font-medium text-brand-text-secondary">Sale Date</label>
                        <input
                            type="date"
                            id="counter-sale-date"
                            value={saleDate}
                            onChange={e => setSaleDate(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-brand-text-secondary">
                            Select the date for this sale. You can enter sales for previous dates if needed.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="counter-item-select" className="block text-sm font-medium text-brand-text-secondary">Item</label>
                         <select id="counter-item-select" value={selectedInventoryItemId} onChange={e => setSelectedInventoryItemId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                             <option value="" disabled>Select an option</option>
                             <option value="manual">-- Manual Entry --</option>
                             {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (PKR {i.sellingPrice})</option>)}
                         </select>
                    </div>

                    {isManualEntry ? (
                        <>
                             <div>
                                <label htmlFor="manual-amount" className="block text-sm font-medium text-brand-text-secondary">Total Amount (PKR)</label>
                                <input type="number" id="manual-amount" value={manualAmount} onChange={e => setManualAmount(e.target.value === '' ? '' : Number(e.target.value))} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                            </div>
                        </>
                    ) : (
                         <div>
                            <label htmlFor="counter-quantity" className="block text-sm font-medium text-brand-text-secondary">Quantity</label>
                            <input type="number" id="counter-quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                        </div>
                    )}
                    
                     <div>
                        <label htmlFor="payment-method-counter" className="block text-sm font-medium text-brand-text-secondary">Payment Method</label>
                        <select
                            id="payment-method-counter"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Bank')}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank / Card</option>
                        </select>
                    </div>
                    
                    <div className="pt-2">
                        <p className="text-lg font-semibold text-right text-brand-text-primary">Total: PKR {amount.toLocaleString()}</p>
                    </div>

                     <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">Record Sale</button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddCounterSaleModal;