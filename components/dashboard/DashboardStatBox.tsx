import React from 'react';

interface DashboardStatBoxProps {
    title: string;
    cash: string | number;
    bank: string | number;
    total: string | number;
    isBold?: boolean;
    isSubItem?: boolean;
    isHighlighted?: boolean;
}

const formatValue = (value: string | number) => {
    if (typeof value === 'string') return value;
    if (value === 0) return '-';
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const DashboardStatBox: React.FC<DashboardStatBoxProps> = ({
    title,
    cash,
    bank,
    total,
    isBold = false,
    isSubItem = false,
    isHighlighted = false,
}) => {
    const baseClasses = "flex justify-between items-center p-3 rounded-lg transition-shadow hover:shadow-md";
    const bgClass = isHighlighted ? 'bg-yellow-100' : 'bg-brand-surface';
    const textClass = isBold ? 'font-semibold text-brand-text-primary' : 'text-brand-text-secondary';
    const titleClass = isSubItem ? 'pl-6' : '';
    const totalColorClass = isHighlighted && typeof total === 'number' && total !== 0 ? 'text-red-600' : 'text-brand-text-primary';

    return (
        <div className={`${baseClasses} ${bgClass} ${textClass}`}>
            <p className={`flex-1 ${titleClass}`}>{title}</p>
            <div className="flex items-center">
                <p className="w-32 text-right">{formatValue(cash)}</p>
                <p className="w-32 text-right">{formatValue(bank)}</p>
                <p className={`w-32 text-right font-bold ${totalColorClass}`}>{formatValue(total)}</p>
            </div>
        </div>
    );
};

export default DashboardStatBox;
