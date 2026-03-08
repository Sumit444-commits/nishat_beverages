import React from 'react';
import { InventoryItem } from '../../types';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { EditIcon } from '../icons/EditIcon';
import { PackageIcon } from '../icons/PackageIcon';
import { TrashIcon } from '../icons/TrashIcon';


interface InventoryProps {
    inventory: InventoryItem[];
    onAddItem: () => void;
    onEditItem: (item: InventoryItem) => void;
    onUpdateStock: (item: InventoryItem) => void;
    onSellItem: (item: InventoryItem) => void;
    onDeleteItem: (itemId: number) => void;
    onViewDetails: (item: InventoryItem) => void;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, onAddItem, onEditItem, onUpdateStock, onSellItem, onDeleteItem, onViewDetails }) => {
    return (
        <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-gray-200">
                <h2 className="text-xl font-bold text-brand-text-primary">Inventory Management</h2>
                <button 
                  onClick={onAddItem}
                  className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue transition-colors"
                >
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Add Item
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-brand-text-secondary">
                    <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Item Name</th>
                            <th scope="col" className="px-6 py-3">Category</th>
                            <th scope="col" className="px-6 py-3">Current Stock</th>
                            <th scope="col" className="px-6 py-3">Low Stock Threshold</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item) => {
                            const isLowStock = item.stock < item.lowStockThreshold;
                            return (
                                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{item.name}</td>
                                    <td className="px-6 py-4">{item.category}</td>
                                    <td className={`px-6 py-4 font-semibold ${isLowStock ? 'text-red-500' : ''}`}>
                                        {item.stock.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">{item.lowStockThreshold}</td>
                                    <td className="px-6 py-4">
                                        {isLowStock ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <AlertTriangleIcon className="h-3 w-3 mr-1.5" />
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                In Stock
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center space-x-4">
                                            <button onClick={() => onViewDetails(item)} className="font-medium text-sm text-brand-blue hover:underline">
                                                Details
                                            </button>
                                            <button onClick={() => onEditItem(item)} title="Edit Item Details" className="text-brand-blue hover:text-brand-accent transition-colors">
                                                <EditIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => onUpdateStock(item)} title="Update Stock" className="text-blue-600 hover:text-blue-800 transition-colors">
                                                <PlusCircleIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => onSellItem(item)} title="Sell Item" className="text-green-600 hover:text-green-800 transition-colors">
                                                <PackageIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => onDeleteItem(item.id)} title="Delete Item" className="text-red-500 hover:text-red-700 transition-colors">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;