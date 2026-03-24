import { useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { useDeliveries } from './useDeliveries';

export const useReportingData = (searchTerm: string = '') => {
  const { state } = useSocket();
  const { suppliers = [] } = state?.addressBook || {};
  const { deliveries } = useDeliveries(1, 1000, '', 'all', 'eta', false);

  const reportData = useMemo(() => {
    return suppliers.map(supplier => {
      const supplierDeliveries = deliveries.filter(d => d.supplierId === supplier.id);
      
      const totalPallets = supplierDeliveries.reduce((sum, d) => sum + (d.palletCount || 0), 0);
      const totalWeight = supplierDeliveries.reduce((sum, d) => sum + (d.weight || 0), 0);
      const totalCost = supplierDeliveries.reduce((sum, d) => sum + (d.transportCost || 0), 0);
      
      return {
        id: supplier.id,
        name: supplier.name,
        count: supplierDeliveries.length,
        pallets: totalPallets,
        weight: totalWeight,
        costs: totalCost,
        avgCostPerPallet: totalPallets > 0 ? (totalCost / totalPallets).toFixed(2) : '0.00'
      };
    }).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [deliveries, suppliers, searchTerm]);

  return {
    reportData,
    isLoading: !state
  };
};
