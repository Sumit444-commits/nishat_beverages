import React, { useState, useEffect } from 'react';
import { Customer, Salesman, Sale } from '../../types';
import { BOTTLE_PRICE } from '../../constants';

interface AddSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSale: (sale: Omit<Sale, 'id'>) => void;
    customer: Customer | null;
    salesmen: Salesman[];
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose, onAddSale, customer, salesmen }) => {
    // FIX: Renamed state to 'quantity' to match the Sale type.
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Pending'>('Pending');
    const [salesmanId, setSalesmanId] = useState<string>('');
    // FIX: Added state for emptiesCollected to match the Sale type.
    const [emptiesCollected, setEmptiesCollected] = useState(0);
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const amount = quantity * BOTTLE_PRICE;

    useEffect(() => {
        if (customer) {
            setSalesmanId(customer.salesmanId?.toString() || (salesmen.length > 0 ? salesmen[0].id.toString() : ''));
            // FIX: Property 'dailyRequirement' does not exist on type 'Customer'. Defaulting to 1.
            setQuantity(1);
        }
    }, [customer, salesmen]);

    const resetForm = () => {
        setQuantity(1);
        setPaymentMethod('Pending');
        setSalesmanId('');
        setEmptiesCollected(0);
        setSaleDate(new Date().toISOString().split('T')[0]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer || !salesmanId) return;

        const newSale: Omit<Sale, 'id'> = {
            customerId: customer.id,
            salesmanId: salesmanId ? Number(salesmanId) : null,
            // FIX: Added missing inventoryItemId property to satisfy the Sale type.
            inventoryItemId: null,
            // FIX: Object literal may only specify known properties, and 'bottlesSold' does not exist in type 'Omit<Sale, "id">'.
            quantity,
            emptiesCollected,
            amount,
            // FIX: Added missing 'amountReceived' property to satisfy the Sale type.
            amountReceived: paymentMethod === 'Pending' ? 0 : amount,
            date: new Date(saleDate).toISOString(),
            paymentMethod,
        };
        onAddSale(newSale);
        resetForm();
        onClose();
    };

    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-brand-text-primary">Add Sale for {customer.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="sale-date-simple" className="block text-sm font-medium text-brand-text-secondary">Sale Date</label>
                        <input
                            type="date"
                            id="sale-date-simple"
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
                        <label htmlFor="bottles-sold" className="block text-sm font-medium text-brand-text-secondary">Bottles Sold</label>
                        <input type="number" id="bottles-sold" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required min="1" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="empties-collected" className="block text-sm font-medium text-brand-text-secondary">Empties Collected</label>
                        <input type="number" id="empties-collected" value={emptiesCollected} onChange={e => setEmptiesCollected(Number(e.target.value))} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="payment-method" className="block text-sm font-medium text-brand-text-secondary">Payment Method</label>
                        <select id="payment-method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                            <option value="Pending">Add to Balance</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank Transfer</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="salesman-assign" className="block text-sm font-medium text-brand-text-secondary">Assigned Salesman</label>
                        <select id="salesman-assign" value={salesmanId} onChange={e => setSalesmanId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm">
                             <option value="" disabled>Select a salesman</option>
                            {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="pt-2">
                        <p className="text-lg font-semibold text-right text-brand-text-primary">Total Amount: PKR {amount.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">Add Sale</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSaleModal;