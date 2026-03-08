import { useState, useEffect } from 'react';
import axios from 'axios';
import { Customer } from '../types';


const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get(`${API_URL}/customers`);
                if (response.data.success) {
                    // Format customers data to have numeric IDs
                    const formattedCustomers = response.data.data.map((c: any, index: number) => ({
                        ...c,
                        id: c.id || index + 1
                    }));
                    setCustomers(formattedCustomers);
                }
            } catch (err) {
                setError('Failed to fetch customers');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    return { customers, loading, error };
};