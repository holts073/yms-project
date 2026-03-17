import { useState, useEffect, useCallback } from 'react';
import { Delivery } from '../types';
import { useSocket } from '../SocketContext';

export interface UseDeliveriesResult {
  deliveries: Delivery[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDeliveries(
  page: number = 1,
  limit: number = 15,
  search: string = '',
  typeFilter: string = 'all',
  sort: string = 'eta',
  activeOnly: boolean = false
): UseDeliveriesResult {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { socket } = useSocket();

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        type: typeFilter,
        sort,
        activeOnly: Boolean(activeOnly).toString()
      });
      
      const res = await fetch(`/api/deliveries?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch deliveries');
      
      const data = await res.json();
      setDeliveries(data.deliveries);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, typeFilter, sort, activeOnly]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for real-time updates from backend
    const handleUpdate = () => {
      fetchDeliveries();
    };
    
    socket.on('DELIVERY_UPDATED', handleUpdate);
    
    return () => {
      socket.off('DELIVERY_UPDATED', handleUpdate);
    };
  }, [socket, fetchDeliveries]);

  return { deliveries, total, totalPages, loading, error, refresh: fetchDeliveries };
}
