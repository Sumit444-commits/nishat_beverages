import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem } from '../../types';

interface UpdateStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
    onUpdateStock: (itemId: number, adjustment: number, reason: string) => void;
}

const UpdateStockModal: React.FC<UpdateStockModalProps> = ({ isOpen, onClose, item, onUpdateStock }) => {
    const [adjustment, setAdjustment] = useState(0);
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setAdjustment(0);
            setReason('');
        }
    }, [isOpen]);

    const newStockLevel = useMemo(() => {
        if (!item) return 0;
        return item.stock + adjustment;
    }, [item, adjustment]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item || adjustment === 0 || !reason) {
            alert("Please provide a non-zero adjustment quantity and a reason.");
            return;
        }
        onUpdateStock(item.id, adjustment, reason);
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Update Stock for {item.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary">Current Stock</label>
                        <p className="mt-1 text-lg font-semibold text-brand-text-primary">{item.stock}</p>
                    </div>
                    <div>
                        <label htmlFor="adjustment-quantity" className="block text-sm font-medium text-brand-text-secondary">Adjustment Quantity</label>
                        <input 
                            type="number" 
                            id="adjustment-quantity" 
                            value={adjustment} 
                            onChange={e => setAdjustment(parseInt(e.target.value) || 0)} 
                            required 
                            placeholder="e.g., 50 or -10"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter a positive number to add stock, or a negative number to remove it.</p>
                    </div>
                    <div>
                        <label htmlFor="adjustment-reason" className="block text-sm font-medium text-brand-text-secondary">Reason for Adjustment</label>
                        <input 
                            type="text" 
                            id="adjustment-reason" 
                            value={reason} 
                            onChange={e => setReason(e.target.value)} 
                            required 
                            placeholder="e.g., New shipment, stock count correction"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary">New Stock Level</label>
                        <p className="mt-1 text-lg font-bold text-brand-blue">{newStockLevel}</p>
                    </div>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue">Update Stock</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateStockModal;
