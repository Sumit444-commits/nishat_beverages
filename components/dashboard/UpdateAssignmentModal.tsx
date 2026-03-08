import React, { useState, useEffect } from 'react';
import { DailyAssignment } from '../../types';

interface UpdateAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: DailyAssignment | null;
    onUpdate: (assignment: DailyAssignment) => void;
    salesmanName: string;
}

const UpdateAssignmentModal: React.FC<UpdateAssignmentModalProps> = ({ isOpen, onClose, assignment, onUpdate, salesmanName }) => {
    const [bottlesReturned, setBottlesReturned] = useState<number | ''>('');

    useEffect(() => {
        if (assignment) {
            setBottlesReturned(assignment.bottlesReturned ?? '');
        }
    }, [assignment]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment || bottlesReturned === '') return;

        onUpdate({
            ...assignment,
            bottlesReturned: Number(bottlesReturned)
        });
        onClose();
    };

    if (!isOpen || !assignment) return null;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-text-primary">Update Return for {salesmanName}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <p className="text-sm text-brand-text-secondary mb-4">
                    Date: {new Date(assignment.date).toLocaleDateString()} | Bottles Assigned: {assignment.bottlesAssigned}
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="bottles-returned" className="block text-sm font-medium text-brand-text-secondary">Bottles Returned (Unsold)</label>
                        <input
                            type="number"
                            id="bottles-returned"
                            value={bottlesReturned}
                            onChange={(e) => setBottlesReturned(e.target.value === '' ? '' : Number(e.target.value))}
                            required
                            min="0"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"
                        />
                    </div>
                     <div className="flex justify-end pt-4 space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold">Update</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateAssignmentModal;
