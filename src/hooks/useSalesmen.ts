import { useState, useEffect } from 'react';
import axios from 'axios';
import { Salesman } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useSalesmen = () => {
    const [salesmen, setSalesmen] = useState<Salesman[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSalesmen = async () => {
            try {
                const response = await axios.get(`${API_URL}/salesmen`);
                if (response.data.success) {
                    // Format salesmen data to have numeric IDs
                    const formattedSalesmen = response.data.data.map((s: any, index: number) => ({
                        ...s,
                        id: s.id || index + 1
                    }));
                    setSalesmen(formattedSalesmen);
                }
            } catch (err) {
                setError('Failed to fetch salesmen');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSalesmen();
    }, []);

    return { salesmen, loading, error };
};