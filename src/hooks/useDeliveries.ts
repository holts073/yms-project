import { useSocket } from '../SocketContext';
import { Delivery, YmsDeliveryStatus } from '../types';

export const useDeliveries = (
  page: number = 1,
  limit: number = 1000,
  search: string = '',
  type: 'all' | 'container' | 'exworks' = 'all',
  sortBy: string = 'eta',
  activeOnly: boolean = false
) => {
  const { state, dispatch } = useSocket();
  const { deliveries: allDeliveries = [] } = state || {};

  // Apply filtering
  let filtered = [...allDeliveries];
  
  if (activeOnly) {
    filtered = filtered.filter(d => d.status < 100);
  }

  if (type !== 'all') {
    filtered = filtered.filter(d => d.type === type);
  }

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(d => 
      String(d.reference || '').toLowerCase().includes(s) || 
      state?.addressBook?.suppliers.find(sup => sup.id === d.supplierId)?.name.toLowerCase().includes(s)
    );
  }

  // Sorting
  filtered.sort((a, b) => {
    const valA = (a as any)[sortBy] || '';
    const valB = (b as any)[sortBy] || '';
    return valA > valB ? 1 : -1;
  });

  // Pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;
  const pagedDeliveries = filtered.slice(offset, offset + limit);

  // Actions
  const updateDeliveryStatus = (id: string, status: number) => {
    dispatch('UPDATE_DELIVERY', { id, status });
  };

  const updateDelivery = (delivery: Partial<Delivery> & { id: string }) => {
    dispatch('UPDATE_DELIVERY', delivery);
  };

  const addDelivery = (delivery: Partial<Delivery>) => {
    dispatch('ADD_DELIVERY', delivery);
  };

  const deleteDelivery = (id: string) => {
    dispatch('DELETE_DELIVERY', id);
  };

  const assignDock = (deliveryId: string, dockId: number, scheduledTime?: string) => {
    dispatch('YMS_ASSIGN_DOCK', { deliveryId, dockId, scheduledTime });
  };

  const registerArrival = (deliveryId: string) => {
    dispatch('YMS_REGISTER_ARRIVAL', deliveryId);
  };

  return {
    deliveries: pagedDeliveries,
    totalItems,
    totalPages,
    loading: !state,
    actions: {
      updateDeliveryStatus,
      updateDelivery,
      addDelivery,
      deleteDelivery,
      assignDock,
      registerArrival
    }
  };
};
