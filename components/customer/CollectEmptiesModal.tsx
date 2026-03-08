import React, { useState } from 'react';
import { Customer } from '../../types';

interface CollectEmptiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
    onConfirm: (customerId: number, bottlesCollected: number) => void;
}

const CollectEmptiesModal: React.FC<CollectEmptiesModalProps> = ({ isOpen, onClose, customer, onConfirm }) => {
    const [bottlesCollected, setBottlesCollected] = useState<number | ''>('');
    const [error, setError] = useState('');

    if (!isOpen || !customer) return null;

    const handleConfirm = () => {
        const numCollected = Number(bottlesCollected);
        if (numCollected <= 0) {
            setError("Please enter a positive number of bottles.");
            return;
        }
        if (numCollected > customer.emptyBottlesHeld) {
            setError(`Cannot collect more than the ${customer.emptyBottlesHeld} bottles held by the customer.`);
            return;
        }
        setError('');
        onConfirm(customer.id, numCollected);
    };

    const handleClose = () => {
        setBottlesCollected('');
        setError('');
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-text-primary">Collect Empties</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <p className="text-brand-text-secondary mb-4">
                    Collecting from: <span className="font-bold">{customer.name}</span>
                </p>
                <p className="text-sm text-brand-text-secondary mb-4">
                    Currently holding: <span className="font-bold text-red-600">{customer.emptyBottlesHeld}</span> empty bottles.
                </p>
                
                <div>
                    <label htmlFor="bottles-collected" className="block text-sm font-medium text-brand-text-secondary">Number of Bottles to Collect</label>
                    <input
                        type="number"
                        id="bottles-collected"
                        value={bottlesCollected}
                        onChange={(e) => setBottlesCollected(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        min="1"
                        max={customer.emptyBottlesHeld}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                    />
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300 font-semibold">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">
                        Confirm Collection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CollectEmptiesModal;