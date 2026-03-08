import React, { useState, useMemo, useEffect } from 'react';
import { AreaAssignment as AreaAssignmentType, Salesman, Customer } from '../../types';
import { PlusCircleIcon, EditIcon, TrashIcon, UsersIcon } from '../icons';
import { useAreaAssignments } from '../../src/hooks/useAreaAssignments';

interface AreaAssignmentProps {
    salesmen: Salesman[];
    customers: Customer[];
    onNavigateToSalesman: (salesmanId: number) => void;
}

const AreaAssignment: React.FC<AreaAssignmentProps> = ({
    salesmen,
    customers,
    onNavigateToSalesman
}) => {
    const [newAreaName, setNewAreaName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editAreaName, setEditAreaName] = useState('');
    const [editSalesmanId, setEditSalesmanId] = useState<string>('unassigned');
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const { 
        areaAssignments, 
        loading, 
        error, 
        addArea, 
        updateArea, 
        deleteArea, 
        getCustomerCount,
        refresh 
    } = useAreaAssignments(salesmen, customers);

    // Show error notification if hook has error
    useEffect(() => {
        if (error) {
            setNotification({ type: 'error', message: error });
        }
    }, [error]);

    // Clear notification after 3 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const filteredAreas = useMemo(() => {
        if (!searchTerm) return areaAssignments;
        const term = searchTerm.toLowerCase();
        return areaAssignments.filter(a => 
            a.area.toLowerCase().includes(term) ||
            (a.salesmanId && salesmen.find(s => s.id === a.salesmanId)?.name.toLowerCase().includes(term))
        );
    }, [areaAssignments, searchTerm, salesmen]);

    const areasBySalesman = useMemo(() => {
        const grouped: { [key: number]: AreaAssignmentType[] } = {};
        areaAssignments.forEach(area => {
            const salesmanId = typeof area.salesmanId === 'string' 
                ? parseInt(area.salesmanId) || 0 
                : area.salesmanId || 0;
            if (!grouped[salesmanId]) {
                grouped[salesmanId] = [];
            }
            grouped[salesmanId].push(area);
        });
        return grouped;
    }, [areaAssignments]);

    const handleAddArea = async () => {
        if (!newAreaName.trim()) return;
        
        const result = await addArea(newAreaName.trim());
        if (result.success) {
            setNewAreaName('');
            setNotification({ type: 'success', message: 'Area added successfully!' });
        } else {
            setNotification({ type: 'error', message: result.error || 'Failed to add area' });
        }
    };

    const handleStartEdit = (area: AreaAssignmentType) => {
        setEditingId(area.id);
        setEditAreaName(area.area);
        setEditSalesmanId(area.salesmanId?.toString() || 'unassigned');
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editAreaName.trim()) return;
        
        const result = await updateArea(
            editingId,
            editAreaName.trim(),
            editSalesmanId === 'unassigned' ? null : Number(editSalesmanId)
        );
        
        if (result.success) {
            setEditingId(null);
            setEditAreaName('');
            setEditSalesmanId('unassigned');
            setNotification({ type: 'success', message: 'Area updated successfully!' });
        } else {
            setNotification({ type: 'error', message: result.error || 'Failed to update area' });
        }
    };

    const handleDeleteArea = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this area?')) return;
        
        const result = await deleteArea(id);
        if (result.success) {
            setNotification({ type: 'success', message: 'Area deleted successfully!' });
        } else {
            setNotification({ type: 'error', message: result.error || 'Failed to delete area' });
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditAreaName('');
        setEditSalesmanId('unassigned');
    };

    const getSalesmanName = (salesmanId: number | string | null) => {
        if (!salesmanId) return 'Unassigned';
        const id = typeof salesmanId === 'string' ? parseInt(salesmanId) : salesmanId;
        return salesmen.find(s => s.id === id)?.name || 'Unknown';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text-primary">Area Assignment Management</h1>
                    <p className="text-brand-text-secondary mt-1">Manage areas and assign them to salesmen manually</p>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`${
                    notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                } border px-4 py-3 rounded-md`}>
                    {notification.message}
                </div>
            )}

            {/* Add New Area */}
            <div className="bg-brand-surface rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-brand-text-primary mb-4">Add New Area</h2>
                <div className="flex gap-3 flex-wrap">
                    <input
                        type="text"
                        placeholder="Enter area name (e.g., Defence Phase 1, Clifton Block 5)"
                        value={newAreaName}
                        onChange={e => setNewAreaName(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddArea()}
                        className="flex-1 min-w-[300px] px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={handleAddArea}
                        disabled={loading}
                        className="flex items-center bg-brand-blue text-white px-6 py-2 rounded-md font-semibold hover:bg-brand-lightblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        {loading ? 'Adding...' : 'Add Area'}
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-brand-surface rounded-xl shadow-md p-4">
                <input
                    type="text"
                    placeholder="Search areas or salesmen..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                />
            </div>

            {loading && areaAssignments.length === 0 ? (
                <div className="bg-brand-surface rounded-xl shadow-md p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                    <p className="mt-2 text-brand-text-secondary">Loading areas...</p>
                </div>
            ) : (
                <>
                    {/* Areas by Salesman View */}
                    <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-brand-text-primary">Areas by Salesman</h2>
                            <p className="text-brand-text-secondary text-sm mt-1">View all areas grouped by assigned salesman</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {Object.entries(areasBySalesman).map(([salesmanIdStr, areas]) => {
                                const salesmanId = Number(salesmanIdStr);
                                const salesman = salesmanId === 0 ? null : salesmen.find(s => s.id === salesmanId);
                                const areaList = areas as AreaAssignmentType[];
                                const totalCustomers = areaList.reduce((sum, area) => sum + getCustomerCount(area.area), 0);

                                return (
                                    <div key={salesmanId} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-brand-text-primary">
                                                    {salesman ? salesman.name : 'Unassigned Areas'}
                                                </h3>
                                                <p className="text-sm text-brand-text-secondary">
                                                    {areaList.length} area(s) • {totalCustomers} customer(s)
                                                </p>
                                            </div>
                                            {salesman && (
                                                <button
                                                    onClick={() => onNavigateToSalesman(salesmanId)}
                                                    className="text-brand-blue hover:text-brand-lightblue font-medium text-sm"
                                                >
                                                    View Salesman Account →
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {areaList.map(area => (
                                                <div key={area.id} className="bg-white border border-gray-200 rounded-md p-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-medium text-brand-text-primary">{area.area}</span>
                                                        <div className="flex items-center space-x-1">
                                                            <UsersIcon className="h-4 w-4 text-brand-text-secondary" />
                                                            <span className="text-sm text-brand-text-secondary">
                                                                {getCustomerCount(area.area)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {Object.keys(areasBySalesman).length === 0 && (
                                <p className="text-center text-brand-text-secondary py-8">
                                    No areas assigned yet. Add areas above to get started.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* All Areas List */}
                    <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-brand-text-primary">All Areas ({filteredAreas.length})</h2>
                            <p className="text-brand-text-secondary text-sm mt-1">Manage all areas and their assignments</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-brand-text-secondary">
                                <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Area Name</th>
                                        <th scope="col" className="px-6 py-3">Assigned Salesman</th>
                                        <th scope="col" className="px-6 py-3">Customers</th>
                                        <th scope="col" className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAreas.map(area => (
                                        <tr key={area.id} className="bg-white border-b hover:bg-gray-50">
                                            {editingId === area.id ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="text"
                                                            value={editAreaName}
                                                            onChange={e => setEditAreaName(e.target.value)}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={editSalesmanId}
                                                            onChange={e => setEditSalesmanId(e.target.value)}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                        >
                                                            <option value="unassigned">Unassigned</option>
                                                            {salesmen.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center">
                                                            <UsersIcon className="h-4 w-4 mr-1" />
                                                            {getCustomerCount(area.area)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={handleSaveEdit}
                                                                className="text-green-600 hover:text-green-800 font-medium text-sm"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4 font-medium text-brand-text-primary">{area.area}</td>
                                                    <td className="px-6 py-4">
                                                        {area.salesmanId ? (
                                                            <button
                                                                onClick={() => onNavigateToSalesman(
                                                                    typeof area.salesmanId === 'string' 
                                                                        ? parseInt(area.salesmanId) 
                                                                        : area.salesmanId
                                                                )}
                                                                className="text-brand-blue hover:text-brand-lightblue hover:underline"
                                                            >
                                                                {getSalesmanName(area.salesmanId)}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-500">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center">
                                                            <UsersIcon className="h-4 w-4 mr-1 text-brand-text-secondary" />
                                                            {getCustomerCount(area.area)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <button
                                                                onClick={() => handleStartEdit(area)}
                                                                className="text-brand-blue hover:text-brand-accent"
                                                            >
                                                                <EditIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteArea(area.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredAreas.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10 px-6 text-brand-text-secondary">
                                                {searchTerm ? 'No areas found matching your search.' : 'No areas have been created yet.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AreaAssignment;