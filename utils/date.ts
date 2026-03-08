export const getLocalDateString = (dateInput: string | number | Date): string => {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number'
        ? new Date(dateInput)
        : dateInput;

    if (isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleDateString('en-CA');
};

export const getTodayLocalDateString = (): string => getLocalDateString(new Date());

