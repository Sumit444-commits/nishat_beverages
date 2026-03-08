import React from 'react';

interface ConfirmClosingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: {
        periodName: string;
        totalRevenue: number;
        totalExpenses: number;
        netBalance: number;
    } | null;
}

const ConfirmClosingModal: React.FC<ConfirmClosingModalProps> = ({ isOpen, onClose, onConfirm, data }) => {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-brand-text-primary mb-4">Confirm Period Closing</h2>
                <p className="text-brand-text-secondary mb-6">
                    You are about to close the books for the period <span className="font-bold text-brand-text-primary">{data.periodName}</span>. This will create a historical record and this action cannot be undone. Please verify the numbers below.
                </p>
                <div className="space-y-2 bg-gray-50 p-4 rounded-md mb-6">
                    <div className="flex justify-between"><span className="text-brand-text-secondary">Total Revenue:</span> <span className="font-semibold">PKR {data.totalRevenue.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-brand-text-secondary">Total Expenses:</span> <span className="font-semibold">PKR {data.totalExpenses.toLocaleString()}</span></div>
                    <div className={`flex justify-between font-bold text-lg border-t pt-2 mt-2 ${data.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}><span>Net Balance:</span> <span>PKR {data.netBalance.toLocaleString()}</span></div>
                </div>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300 font-semibold">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">
                        Confirm & Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmClosingModal;
