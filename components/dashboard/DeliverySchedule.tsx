import React, { useMemo, useState } from 'react';
import { Customer, Sale, AreaAssignment, Salesman } from '../../types';
import { isDeliveryDueOn } from '../../utils/delivery-helper';
import { TruckIcon, UsersIcon } from '../icons';

interface DeliveryScheduleProps {
    customers: Customer[];
    sales: Sale[];
    areaAssignments: AreaAssignment[];
    salesmen: Salesman[];
    onNavigateToAreaAssignment: () => void;
    onViewCustomerDetails: (customer: Customer) => void;
    onViewSalesmanDetails: (salesmanId: number) => void;
}

const DeliverySchedule: React.FC<DeliveryScheduleProps> = ({ 
    customers, 
    sales, 
    areaAssignments, 
    salesmen,
    onNavigateToAreaAssignment,
    onViewCustomerDetails,
    onViewSalesmanDetails
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    // Get all unique areas from customers
    const allAreas = useMemo(() => {
        const areaSet = new Set<string>();
        customers.forEach(c => {
            if (c.area && c.area.trim()) {
                areaSet.add(c.area.trim());
            }
        });
        return Array.from(areaSet).sort();
    }, [customers]);

    // Group customers by area
    const customersByArea = useMemo(() => {
        const grouped: { [area: string]: Customer[] } = {};
        customers.forEach(customer => {
            const area = customer.area?.trim() || 'Unassigned Area';
            if (!grouped[area]) {
                grouped[area] = [];
            }
            grouped[area].push(customer);
        });
        return grouped;
    }, [customers]);

    // Get salesman for each area
    const getSalesmanForArea = (area: string): Salesman | null => {
        const assignment = areaAssignments.find(a => a.area === area);
        if (assignment && assignment.salesmanId) {
            return salesmen.find(s => s.id === assignment.salesmanId) || null;
        }
        return null;
    };

    // Get deliveries for a specific date grouped by area
    const getDeliveriesByArea = (date: Date) => {
        const deliveriesByArea: { [area: string]: { customers: Customer[]; salesman: Salesman | null } } = {};
        
        allAreas.forEach(area => {
            const areaCustomers = customersByArea[area] || [];
            const dueCustomers = areaCustomers.filter(customer => isDeliveryDueOn(date, customer, sales));
            
            if (dueCustomers.length > 0) {
                deliveriesByArea[area] = {
                    customers: dueCustomers,
                    salesman: getSalesmanForArea(area)
                };
            }
        });

        // Also include unassigned area customers
        const unassignedCustomers = (customersByArea['Unassigned Area'] || []).filter(customer => 
            isDeliveryDueOn(date, customer, sales)
        );
        if (unassignedCustomers.length > 0) {
            deliveriesByArea['Unassigned Area'] = {
                customers: unassignedCustomers,
                salesman: null
            };
        }

        return deliveriesByArea;
    };

    const schedule = weekDays.map(date => ({
        date,
        deliveriesByArea: getDeliveriesByArea(date)
    }));

    const totalDeliveriesToday = useMemo(() => {
        const today = new Date();
        const todayDeliveries = getDeliveriesByArea(today);
        return Object.values(todayDeliveries).reduce((sum, area) => sum + area.customers.length, 0);
    }, [customers, sales, allAreas, customersByArea, areaAssignments, salesmen]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text-primary">Area-Wise Delivery Schedule</h1>
                    <p className="text-brand-text-secondary mt-1">
                        Showing deliveries organized by area with assigned salesmen for the next 7 days
                    </p>
                </div>
                <button
                    onClick={onNavigateToAreaAssignment}
                    className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-lightblue transition-colors"
                >
                    <TruckIcon className="h-5 w-5 mr-2" />
                    Manage Area Assignments
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-brand-surface rounded-lg shadow-md p-4">
                    <p className="text-sm text-brand-text-secondary">Total Areas</p>
                    <p className="text-2xl font-bold text-brand-text-primary">{allAreas.length}</p>
                </div>
                <div className="bg-brand-surface rounded-lg shadow-md p-4">
                    <p className="text-sm text-brand-text-secondary">Today's Deliveries</p>
                    <p className="text-2xl font-bold text-brand-text-primary">{totalDeliveriesToday}</p>
                </div>
                <div className="bg-brand-surface rounded-lg shadow-md p-4">
                    <p className="text-sm text-brand-text-secondary">Assigned Salesmen</p>
                    <p className="text-2xl font-bold text-brand-text-primary">
                        {new Set(areaAssignments.filter(a => a.salesmanId).map(a => a.salesmanId)).size}
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                {schedule.map(({ date, deliveriesByArea }, index) => {
                    const isToday = index === 0;
                    const areaEntries = Object.entries(deliveriesByArea);
                    
                    return (
                        <div key={index} className="bg-brand-surface rounded-lg shadow-md flex flex-col min-h-[500px]">
                            <div className={`p-3 text-center rounded-t-lg ${isToday ? 'bg-brand-blue text-white' : 'bg-gray-100'}`}>
                                <p className="font-bold text-lg">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                <p className="text-sm">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                {isToday && (
                                    <p className="text-xs mt-1 opacity-90">Today</p>
                                )}
                            </div>
                            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                                {areaEntries.length > 0 ? (
                                    areaEntries.map(([area, { customers: dueCustomers, salesman }]) => (
                                        <div key={area} className="bg-white rounded-lg border border-gray-200 p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-sm text-brand-text-primary mb-1">{area}</h3>
                                                    {salesman ? (
                                                        <button
                                                            onClick={() => onViewSalesmanDetails(salesman.id)}
                                                            className="flex items-center text-xs text-brand-blue hover:text-brand-lightblue hover:underline"
                                                        >
                                                            <TruckIcon className="h-3 w-3 mr-1" />
                                                            {salesman.name}
                                                        </button>
                                                    ) : (
                                                        <p className="text-xs text-gray-500">No salesman assigned</p>
                                                    )}
                                                </div>
                                                <span className="text-xs font-semibold text-brand-text-secondary bg-gray-100 px-2 py-1 rounded">
                                                    {dueCustomers.length}
                                                </span>
                                            </div>
                                            <div className="space-y-1 mt-2 max-h-48 overflow-y-auto">
                                                {dueCustomers.map(customer => {
                                                    const customerSalesman = customer.salesmanId 
                                                        ? salesmen.find(s => s.id === customer.salesmanId) 
                                                        : null;
                                                    return (
                                                        <div 
                                                            key={customer.id} 
                                                            className="p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100 hover:shadow-sm transition-all cursor-pointer"
                                                            onClick={() => onViewCustomerDetails(customer)}
                                                        >
                                                            <p className="font-medium text-xs text-brand-text-primary truncate">{customer.name}</p>
                                                            <p className="text-xs text-brand-text-secondary truncate">{customer.mobile}</p>
                                                            {customerSalesman && (
                                                                <p className="text-xs text-brand-blue mt-1 flex items-center">
                                                                    <TruckIcon className="h-3 w-3 mr-1" />
                                                                    {customerSalesman.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-xs text-center text-gray-400 p-4">No deliveries scheduled</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Area Summary Section */}
            <div className="bg-brand-surface rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-text-primary">Area Summary</h2>
                    <button
                        onClick={onNavigateToAreaAssignment}
                        className="text-sm text-brand-blue hover:text-brand-lightblue hover:underline"
                    >
                        Manage Areas →
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allAreas.map(area => {
                        const areaCustomers = customersByArea[area] || [];
                        const todayDeliveries = areaCustomers.filter(c => isDeliveryDueOn(new Date(), c, sales));
                        const salesman = getSalesmanForArea(area);
                        
                        return (
                            <div key={area} className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-brand-text-primary">{area}</h3>
                                    <span className="text-xs font-semibold text-brand-text-secondary bg-gray-100 px-2 py-1 rounded">
                                        {todayDeliveries.length} today
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-brand-text-secondary">
                                        Total Customers: {areaCustomers.length}
                                    </p>
                                    {salesman ? (
                                        <button
                                            onClick={() => onViewSalesmanDetails(salesman.id)}
                                            className="flex items-center text-xs text-brand-blue hover:text-brand-lightblue hover:underline"
                                        >
                                            <TruckIcon className="h-3 w-3 mr-1" />
                                            Assigned: {salesman.name}
                                        </button>
                                    ) : (
                                        <p className="text-xs text-gray-500">No salesman assigned</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {allAreas.length === 0 && (
                        <div className="col-span-full text-center py-8 text-brand-text-secondary">
                            <p>No areas defined yet.</p>
                            <button
                                onClick={onNavigateToAreaAssignment}
                                className="mt-2 text-brand-blue hover:text-brand-lightblue hover:underline"
                            >
                                Create areas in Area Assignment →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliverySchedule;