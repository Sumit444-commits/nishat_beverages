import React from 'react';
import { Salesman } from '../../types';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { EditIcon } from '../icons/EditIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface SalesmenProps {
    salesmen: Salesman[];
    onAddSalesman: () => void;
    onViewDetails: (salesman: Salesman) => void;
    onEditSalesman: (salesman: Salesman) => void;
    onDeleteSalesman: (salesmanId: number) => void;
}

const Salesmen: React.FC<SalesmenProps> = ({ salesmen, onAddSalesman, onViewDetails, onEditSalesman, onDeleteSalesman }) => {
    return (
        <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-xl font-bold text-brand-text-primary">Salesmen Management</h2>
                <button 
                  onClick={onAddSalesman}
                  className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue transition-colors"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Add Salesman
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-brand-text-secondary">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Mobile</th>
                            <th scope="col" className="px-6 py-3">Hire Date</th>
                            <th scope="col" className="px-6 py-3">Customers Assigned</th>
                            <th scope="col" className="px-6 py-3">Quantity Sold Today</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesmen.map((salesman) => (
                            <tr key={salesman.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-brand-text-primary">
                                    <button onClick={() => onViewDetails(salesman)} className="hover:underline">
                                        {salesman.name}
                                    </button>
                                </td>
                                <td className="px-6 py-4">{salesman.mobile}</td>
                                <td className="px-6 py-4">{new Date(salesman.hireDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{salesman.customersAssigned}</td>
                                <td className="px-6 py-4 font-semibold">{salesman.quantitySoldToday}</td>
                                <td className="px-6 py-4">
                                     <div className="flex items-center space-x-3">
                                        <button onClick={() => onEditSalesman(salesman)} className="text-brand-blue hover:text-brand-accent"><EditIcon className="h-4 w-4" /></button>
                                        <button onClick={() => onDeleteSalesman(salesman.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button>
                                        <button onClick={() => onViewDetails(salesman)} className="font-medium text-sm text-brand-blue hover:underline">View</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Salesmen;