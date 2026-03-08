import React from 'react';

const AddSaleToCustomerModal: React.FC<{isOpen?: boolean, onClose?: () => void}> = ({isOpen, onClose}) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-brand-text-primary mb-6">Add New Sale</h2>
                <p>This is a placeholder modal to add a sale to any customer.</p>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-brand-text-secondary rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
};

export default AddSaleToCustomerModal;
