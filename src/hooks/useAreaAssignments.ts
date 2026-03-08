import { useState, useEffect, useCallback } from 'react';
import { areaAssignmentService, AreaAssignment } from '../services/areaAssignmentService';
import { Salesman, Customer } from '../types';

export const useAreaAssignments = (
  salesmen: Salesman[],
  customers: Customer[]
) => {
  const [areaAssignments, setAreaAssignments] = useState<AreaAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await areaAssignmentService.getAll();
      if (response.success) {
        // Convert string IDs to numbers for compatibility with existing component
        const formattedAreas = response.data.map(area => ({
          ...area,
          id: parseInt(area._id, 36) // Convert ObjectId to number for compatibility
        }));
        setAreaAssignments(formattedAreas);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch areas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas, refreshTrigger]);

  const addArea = async (area: string) => {
    try {
      const response = await areaAssignmentService.create({ area });
      if (response.success) {
        setRefreshTrigger(prev => prev + 1);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to add area' 
      };
    }
  };

  const updateArea = async (id: number, area: string, salesmanId: number | null) => {
    try {
      // Find the area to get its actual MongoDB _id
      const areaToUpdate = areaAssignments.find(a => a.id === id);
      if (!areaToUpdate) {
        return { success: false, error: 'Area not found' };
      }

      const response = await areaAssignmentService.update(areaToUpdate._id, {
        area,
        salesmanId: salesmanId?.toString() || null
      });
      
      if (response.success) {
        setRefreshTrigger(prev => prev + 1);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to update area' 
      };
    }
  };

  const deleteArea = async (id: number) => {
    try {
      // Find the area to get its actual MongoDB _id
      const areaToDelete = areaAssignments.find(a => a.id === id);
      if (!areaToDelete) {
        return { success: false, error: 'Area not found' };
      }

      const response = await areaAssignmentService.delete(areaToDelete._id);
      if (response.success) {
        setRefreshTrigger(prev => prev + 1);
        return { success: true, message: response.message };
      }
      return { success: false, error: response.message };
    } catch (err: any) {
      return { 
        success: false, 
        error: err.response?.data?.message || 'Failed to delete area' 
      };
    }
  };

  const getCustomerCount = (area: string) => {
    return customers.filter(c => c.area === area).length;
  };

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    areaAssignments,
    loading,
    error,
    addArea,
    updateArea,
    deleteArea,
    getCustomerCount,
    refresh
  };
};