import React, { useState, useMemo } from 'react';
import { Salesman, DailyAssignment } from '../../types';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';
import { EditIcon } from '../icons/EditIcon';
import UpdateAssignmentModal from './UpdateAssignmentModal';

interface DailyBottlesAssignedProps {
    salesmen: Salesman[];
    assignments: DailyAssignment[];
    onAddAssignment: (assignment: Omit<DailyAssignment, 'id'>) => void;
    onUpdateAssignment: (assignment: DailyAssignment) => void;
}

const DailyBottlesAssigned: React.FC<DailyBottlesAssignedProps> = ({ salesmen, assignments, onAddAssignment, onUpdateAssignment }) => {
    const todayISO = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayISO);
    const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>('');
    const [bottlesAssigned, setBottlesAssigned] = useState<number | ''>('');

    const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<DailyAssignment | null>(null);

    const getSalesmanName = (salesmanId: number) => {
        return salesmen.find(s => s.id === salesmanId)?.name || 'Unknown';
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSalesmanId || bottlesAssigned === '' || bottlesAssigned <= 0) {
            alert("Please select a salesman and enter a valid number of bottles.");
            return;
        }

        const newAssignment: Omit<DailyAssignment, 'id'> = {
            salesmanId: Number(selectedSalesmanId),
            date: todayISO,
            bottlesAssigned: Number(bottlesAssigned),
            bottlesReturned: null,
        };

        onAddAssignment(newAssignment);
        setSelectedSalesmanId('');
        setBottlesAssigned('');
    };

    const handleOpenUpdateModal = (assignment: DailyAssignment) => {
        setSelectedAssignment(assignment);
        setUpdateModalOpen(true);
    };

    const filteredAssignments = useMemo(() => {
        return assignments
            .filter(a => new Date(a.date).toISOString().split('T')[0] === selectedDate)
            .sort((a, b) => getSalesmanName(a.salesmanId).localeCompare(getSalesmanName(b.salesmanId)));
    }, [assignments, selectedDate, salesmen]);
    
    const availableSalesmen = useMemo(() => {
        return salesmen;
    }, [salesmen]);

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-brand-text-primary">Daily Assignments</h1>

                <div className="bg-brand-surface p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">Assign Bottles for Today ({new Date(todayISO).toLocaleDateString()})</h2>
                    <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="salesman-select" className="block text-sm font-medium text-brand-text-secondary">Salesman</label>
                            <select
                                id="salesman-select"
                                value={selectedSalesmanId}
                                onChange={e => setSelectedSalesmanId(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            >
                                <option value="" disabled>Select a salesman</option>
                                {availableSalesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="bottles-assigned" className="block text-sm font-medium text-brand-text-secondary">Bottles to Assign (Full)</label>
                            <input
                                type="number"
                                id="bottles-assigned"
                                value={bottlesAssigned}
                                onChange={e => setBottlesAssigned(e.target.value === '' ? '' : Number(e.target.value))}
                                required
                                min="1"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="flex items-center justify-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue transition-colors h-10"
                        >
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            Save Assignment
                        </button>
                    </form>
                    {availableSalesmen.length === 0 && <p className="text-sm text-brand-text-secondary mt-4">No salesmen available.</p>}
                </div>
                
                <div className="bg-brand-surface rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 flex justify-between items-center border-b border-gray-200">
                        <div>
                            <h2 className="text-xl font-bold text-brand-text-primary">Assignment Records</h2>
                            <p className="text-sm text-brand-text-secondary">Showing records for the selected date.</p>
                        </div>
                        <div>
                            <label htmlFor="date-filter" className="sr-only">Filter by Date</label>
                            <input
                                type="date"
                                id="date-filter"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-brand-text-secondary">
                            <thead className="text-xs text-brand-text-secondary uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Salesman</th>
                                    <th scope="col" className="px-6 py-3">Assigned (Full)</th>
                                    <th scope="col" className="px-6 py-3">Returned (Unsold)</th>
                                    <th scope="col" className="px-6 py-3">Bottles Sold</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.map(assignment => {
                                    const bottlesSold = assignment.bottlesReturned !== null ? assignment.bottlesAssigned - assignment.bottlesReturned : null;
                                    return (
                                        <tr key={assignment.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-brand-text-primary">{getSalesmanName(assignment.salesmanId)}</td>
                                            <td className="px-6 py-4 font-semibold">{assignment.bottlesAssigned}</td>
                                            <td className="px-6 py-4 font-semibold">
                                                {assignment.bottlesReturned !== null ? assignment.bottlesReturned : <span className="text-gray-400">Pending</span>}
                                            </td>
                                            <td className={`px-6 py-4 font-bold text-green-600`}>
                                                {bottlesSold !== null ? bottlesSold : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleOpenUpdateModal(assignment)} className="flex items-center text-brand-blue hover:underline text-sm font-medium">
                                                    <EditIcon className="h-4 w-4 mr-1"/>
                                                    {assignment.bottlesReturned !== null ? 'Edit Return' : 'Add Return'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredAssignments.length === 0 && (
                                     <tr>
                                        <td colSpan={5} className="text-center py-10 px-6 text-brand-text-secondary">
                                            No assignments found for {new Date(selectedDate).toLocaleDateString()}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
             <UpdateAssignmentModal
                isOpen={isUpdateModalOpen}
                onClose={() => setUpdateModalOpen(false)}
                assignment={selectedAssignment}
                onUpdate={onUpdateAssignment}
                salesmanName={getSalesmanName(selectedAssignment?.salesmanId || 0)}
            />
        </>
    );
};

export default DailyBottlesAssigned;
