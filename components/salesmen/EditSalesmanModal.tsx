import React, { useState, useEffect } from 'react';
import { Salesman } from '../../types';

interface EditSalesmanModalProps {
    isOpen: boolean;
    onClose: () => void;
    salesman: Salesman | null;
    onUpdateSalesman: (salesman: Salesman) => void;
}

const EditSalesmanModal: React.FC<EditSalesmanModalProps> = ({ isOpen, onClose, salesman, onUpdateSalesman }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [hireDate, setHireDate] = useState('');
    const [monthlySalary, setMonthlySalary] = useState<number | ''>('');

    useEffect(() => {
        if (salesman) {
            setName(salesman.name);
            setMobile(salesman.mobile);
            setHireDate(salesman.hireDate.split('T')[0]);
            setMonthlySalary(salesman.monthlySalary);
        }
    }, [salesman]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!salesman) return;

        const updatedSalesman: Salesman = {
            ...salesman,
            name,
            mobile,
            hireDate,
            monthlySalary: Number(monthlySalary),
        };
        onUpdateSalesman(updatedSalesman);
    };

    if (!isOpen || !salesman) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Edit Salesman Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-salesman-name" className="block text-sm font-medium text-brand-text-secondary">Full Name</label>
                        <input type="text" id="edit-salesman-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="edit-salesman-mobile" className="block text-sm font-medium text-brand-text-secondary">Mobile Number</label>
                        <input type="tel" id="edit-salesman-mobile" value={mobile} onChange={e => setMobile(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="edit-salesman-hire-date" className="block text-sm font-medium text-brand-text-secondary">Hire Date</label>
                        <input type="date" id="edit-salesman-hire-date" value={hireDate} onChange={e => setHireDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="edit-salesman-salary" className="block text-sm font-medium text-brand-text-secondary">Monthly Salary (PKR)</label>
                        <input type="number" id="edit-salesman-salary" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                    </div>
                    <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">Update Salesman</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSalesmanModal;