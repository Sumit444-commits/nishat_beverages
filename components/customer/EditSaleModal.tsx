import React, { useState, useEffect } from 'react';
import { Customer, Salesman, Sale, InventoryItem } from '../../types';

interface EditSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateSale: (sale: Sale) => void;
    sale: Sale | null;
    customers: Customer[];
    salesmen: Salesman[];
    inventory: InventoryItem[];
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({ isOpen, onClose, onUpdateSale, sale, customers, salesmen, inventory }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState<number | ''>('');
    const [emptiesCollected, setEmptiesCollected] = useState<number | ''>(0);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Pending'>('Pending');
    const [salesmanId, setSalesmanId] = useState<string>('');
    const [amountReceived, setAmountReceived] = useState<number | ''>('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

    const amount = (Number(unitPrice) || 0) * quantity;

    const resetForm = () => {
        setSelectedCustomerId('');
        setSelectedInventoryItemId('');
        setQuantity(1);
        setUnitPrice('');
        setEmptiesCollected(0);
        setPaymentMethod('Pending');
        setSalesmanId('');
        setAmountReceived('');
        setSaleDate(new Date().toISOString().split('T')[0]);
    };

    useEffect(() => {
        if (isOpen && sale) {
            setSelectedCustomerId(sale.customerId?.toString() || '');
            setSelectedInventoryItemId(sale.inventoryItemId?.toString() || '');
            setQuantity(sale.quantity);
            setUnitPrice(sale.amount / sale.quantity);
            setEmptiesCollected(sale.emptiesCollected);
            setPaymentMethod(sale.paymentMethod);
            setSalesmanId(sale.salesmanId?.toString() || '');
            setAmountReceived(sale.amountReceived);
            setSaleDate(new Date(sale.date).toISOString().split('T')[0]);
        } else if (!isOpen) {
            resetForm();
        }
    }, [isOpen, sale]);

    useEffect(() => {
        const selectedItem = inventory.find(i => i.id === Number(selectedInventoryItemId));
        if (selectedItem && !unitPrice) {
            setUnitPrice(selectedItem.sellingPrice);
        }
    }, [selectedInventoryItemId, inventory, unitPrice]);

    useEffect(() => {
        if (paymentMethod === 'Pending') {
            setAmountReceived(0);
        } else {
            setAmountReceived(amount);
        }
    }, [paymentMethod, amount]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sale || !selectedCustomerId || !selectedInventoryItemId) {
            alert("Please fill in all required fields.");
            return;
        }

        const updatedSale: Sale = {
            ...sale,
            customerId: Number(selectedCustomerId),
            salesmanId: salesmanId ? Number(salesmanId) : null,
            inventoryItemId: Number(selectedInventoryItemId),
            quantity,
            emptiesCollected: Number(emptiesCollected) || 0,
            amount,
            amountReceived: Number(amountReceived) || 0,
            date: new Date(saleDate).toISOString(),
            paymentMethod,
        };
        onUpdateSale(updatedSale);
        onClose();
    };

    if (!isOpen || !sale) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-brand-text-primary">Edit Sale</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-sale-date" className="block text-sm font-medium text-brand-text-secondary">Sale Date</label>
                        <input
                            type="date"
                            id="edit-sale-date"
                            value={saleDate}
                            onChange={e => setSaleDate(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-customer-select" className="block text-sm font-medium text-brand-text-secondary">Customer</label>
                        <select id="edit-customer-select" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option value="" disabled>Select a customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="edit-item-select" className="block text-sm font-medium text-brand-text-secondary">Item</label>
                        <select id="edit-item-select" value={selectedInventoryItemId} onChange={e => setSelectedInventoryItemId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option value="" disabled>Select an item</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (PKR {i.sellingPrice})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-quantity" className="block text-sm font-medium text-brand-text-secondary">Quantity</label>
                            <input type="number" id="edit-quantity" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="edit-unitPrice" className="block text-sm font-medium text-brand-text-secondary">Unit Price (PKR)</label>
                            <input type="number" id="edit-unitPrice" value={unitPrice} onChange={e => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-empties" className="block text-sm font-medium text-brand-text-secondary">Empties Collected</label>
                        <input type="number" id="edit-empties" value={emptiesCollected} onChange={e => setEmptiesCollected(e.target.value === '' ? '' : Number(e.target.value))} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>

                    <div>
                        <label htmlFor="edit-payment-method" className="block text-sm font-medium text-brand-text-secondary">Payment Method</label>
                        <select id="edit-payment-method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option value="Pending">Add to Balance</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank Transfer</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="edit-amount-received" className="block text-sm font-medium text-brand-text-secondary">Amount Received (PKR)</label>
                        <input type="number" id="edit-amount-received" value={amountReceived} onChange={e => setAmountReceived(e.target.value === '' ? '' : Number(e.target.value))} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>

                    <div>
                        <label htmlFor="edit-salesman-assign" className="block text-sm font-medium text-brand-text-secondary">Assigned Salesman</label>
                        <select id="edit-salesman-assign" value={salesmanId} onChange={e => setSalesmanId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option value="" disabled>Select a salesman</option>
                            {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="pt-2">
                        <p className="text-lg font-semibold text-right text-brand-text-primary">Total Amount: PKR {amount.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">Update Sale</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSaleModal;