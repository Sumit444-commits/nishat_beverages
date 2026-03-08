import React, { useState, useEffect } from 'react';
import { Customer, Salesman, AreaAssignment } from '../../types';

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCustomer: (customer: Customer) => void;
    salesmen: Salesman[];
    areas?: string[];
    areaAssignments?: AreaAssignment[];
    onNavigateToAreaAssignment?: () => void;
}

// API response interface
interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ 
    isOpen, 
    onClose, 
    onAddCustomer, 
    salesmen, 
    areas = [], 
    areaAssignments = [], 
    onNavigateToAreaAssignment 
}) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [area, setArea] = useState('');
    const [salesmanId, setSalesmanId] = useState<string>('');
    const [outstandingBalance, setOutstandingBalance] = useState(0);
    const [deliveryFrequency, setDeliveryFrequency] = useState(1);
    const [emptyBottles, setEmptyBottles] = useState(0);
    const [notes, setNotes] = useState('');
    const [autoAssignedSalesman, setAutoAssignedSalesman] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [availableAreas, setAvailableAreas] = useState<string[]>(areas);

    // Auto-assign salesman when area changes
    useEffect(() => {
        if (area.trim()) {
            const areaAssignment = areaAssignments.find(a => a.area === area.trim());
            if (areaAssignment && areaAssignment.salesmanId) {
                // Only auto-assign if no manual override or if current selection is unassigned
                if (!autoAssignedSalesman || salesmanId === '') {
                    setSalesmanId(areaAssignment.salesmanId.toString());
                    setAutoAssignedSalesman(areaAssignment.salesmanId.toString());
                }
            } else {
                // If area doesn't have assignment, reset to unassigned only if it was auto-assigned
                if (autoAssignedSalesman && salesmanId === autoAssignedSalesman) {
                    setSalesmanId('');
                    setAutoAssignedSalesman(null);
                }
            }
        } else {
            // If area is cleared, reset only if it was auto-assigned
            if (autoAssignedSalesman && salesmanId === autoAssignedSalesman) {
                setSalesmanId('');
                setAutoAssignedSalesman(null);
            }
        }
    }, [area, areaAssignments]);

    // Fetch areas from API when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchAreas();
            resetForm();
        }
    }, [isOpen]);

    const fetchAreas = async () => {
        try {
            const response = await fetch(`${API_URL}/customers/areas/list`);
            const data = await response.json();
            if (data.success && data.data) {
                setAvailableAreas(data.data);
            }
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
    };

    const resetForm = () => {
        setName('');
        setAddress('');
        setMobile('');
        setArea('');
        setSalesmanId('');
        setOutstandingBalance(0);
        setDeliveryFrequency(1);
        setEmptyBottles(0);
        setNotes('');
        setAutoAssignedSalesman(null);
        setError('');
        setSuccess('');
    };

    const validateForm = () => {
        if (!name.trim()) {
            setError('Customer name is required');
            return false;
        }
        
        if (!address.trim()) {
            setError('Address is required');
            return false;
        }
        
        if (!mobile.trim()) {
            setError('Mobile number is required');
            return false;
        }
        
        // Basic mobile validation
        const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanedMobile = mobile.replace(/\D/g, '');
        if (!mobileRegex.test(cleanedMobile)) {
            setError('Please enter a valid mobile number');
            return false;
        }
        
        if (!area.trim()) {
            setError('Area is required');
            return false;
        }
        
        if (outstandingBalance < 0) {
            setError('Outstanding balance cannot be negative');
            return false;
        }
        
        if (deliveryFrequency < 1) {
            setError('Delivery frequency must be at least 1 day');
            return false;
        }
        
        if (emptyBottles < 0) {
            setError('Empty bottles cannot be negative');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Prepare customer data - IMPORTANT: Match backend expectations
            const customerData = {
                name: name.trim(),
                address: address.trim(),
                mobile: mobile.trim(),
                area: area.trim(),
                salesmanId: salesmanId || null, // Send null if empty
                totalBalance: outstandingBalance,
                deliveryFrequencyDays: deliveryFrequency,
                emptyBottlesHeld: emptyBottles,
                notes: notes.trim()
            };

            console.log('Sending customer data to server:', customerData);

            const response = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customerData),
            });

            const data: ApiResponse<Customer> = await response.json();
            
            console.log('Server response:', data);

            if (!response.ok) {
                throw new Error(data.message || `Failed to add customer (Status: ${response.status})`);
            }

            if (data.success && data.data) {
                setSuccess('Customer added successfully!');
                
                // Call parent callback with formatted customer
                onAddCustomer(data.data);
                
                // Reset form and close modal after delay
                setTimeout(() => {
                    resetForm();
                    onClose();
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to add customer');
            }

        } catch (error) {
            console.error('Error adding customer:', error);
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-brand-text-primary">Add New Customer</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                        disabled={isLoading}
                    >
                        &times;
                    </button>
                </div>
                
                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-600 text-sm">{success}</p>
                    </div>
                )}
                
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Full Name *
                            </label>
                            <input 
                                type="text" 
                                placeholder="Full Name" 
                                value={name} 
                                onChange={e => {
                                    setName(e.target.value);
                                    setError('');
                                }}
                                required 
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                            />
                        </div>
                        
                        {/* Mobile */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Mobile Number *
                            </label>
                            <input 
                                type="tel" 
                                placeholder="e.g., 03001234567" 
                                value={mobile} 
                                onChange={e => {
                                    setMobile(e.target.value);
                                    setError('');
                                }}
                                required 
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                            />
                        </div>
                        
                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Full Address *
                            </label>
                            <textarea
                                placeholder="Full Address"
                                value={address}
                                onChange={e => {
                                    setAddress(e.target.value);
                                    setError('');
                                }}
                                required
                                rows={3}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                            />
                        </div>
                        
                        {/* Area */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Area/Sector *
                                {onNavigateToAreaAssignment && (
                                    <button
                                        type="button"
                                        onClick={onNavigateToAreaAssignment}
                                        disabled={isLoading}
                                        className="ml-2 text-xs text-brand-blue hover:text-brand-lightblue hover:underline disabled:text-gray-400"
                                    >
                                        (Manage Areas)
                                    </button>
                                )}
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={area}
                                    onChange={e => {
                                        setArea(e.target.value);
                                        setError('');
                                    }}
                                    disabled={isLoading}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                                >
                                    <option value="">Select Area</option>
                                    {availableAreas.map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Or enter new area"
                                    value={area}
                                    onChange={e => {
                                        setArea(e.target.value);
                                        setError('');
                                    }}
                                    disabled={isLoading}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                                />
                            </div>
                        </div>
                        
                        {/* Salesman */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Assigned Salesman
                                {autoAssignedSalesman && (
                                    <span className="ml-2 text-xs text-green-600 font-medium">
                                        (Auto-assigned from area)
                                    </span>
                                )}
                            </label>
                            <select 
                                value={salesmanId} 
                                onChange={e => {
                                    setSalesmanId(e.target.value);
                                    setAutoAssignedSalesman(null);
                                    setError('');
                                }}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                            >
                                <option value="">Unassigned Salesman</option>
                                {salesmen.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {autoAssignedSalesman && (
                                <p className="mt-1 text-xs text-green-600">
                                    Salesman automatically assigned based on area assignment
                                </p>
                            )}
                        </div>
                        
                        {/* Outstanding Balance */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Initial Outstanding Balance (PKR)
                            </label>
                            <input 
                                type="number" 
                                placeholder="0" 
                                value={outstandingBalance} 
                                onChange={e => {
                                    setOutstandingBalance(Number(e.target.value));
                                    setError('');
                                }}
                                required 
                                min="0"
                                step="0.01"
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                            />
                        </div>
                        
                        {/* Delivery Frequency */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Delivery Frequency (Days) *
                            </label>
                            <input 
                                type="number" 
                                value={deliveryFrequency} 
                                onChange={e => {
                                    setDeliveryFrequency(Number(e.target.value));
                                    setError('');
                                }}
                                required 
                                min="1"
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                            />
                        </div>
                        
                        {/* Empty Bottles */}
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Initial Empty Bottles Held
                            </label>
                            <input 
                                type="number" 
                                value={emptyBottles} 
                                onChange={e => {
                                    setEmptyBottles(Number(e.target.value));
                                    setError('');
                                }}
                                required 
                                min="0"
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                            />
                        </div>
                        
                        {/* Notes */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                                Notes (Optional)
                            </label>
                            <textarea
                                placeholder="Additional notes about the customer..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm disabled:bg-gray-100"
                            />
                        </div>
                    </div>
                    
                    {/* Form Actions */}
                    <div className="flex justify-end pt-4 space-x-4 border-t border-gray-200">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isLoading}
                            className="px-6 py-2 bg-gray-100 text-brand-text-secondary rounded-md hover:bg-gray-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-lightblue font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding...
                                </>
                            ) : 'Add Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomerModal;