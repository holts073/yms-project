import { useSocket } from '../SocketContext';
import { YmsWarehouse, YmsDock, YmsWaitingArea, YmsTemperature, YmsWaitingAreaStatus } from '../types';

export const useYmsData = () => {
  const { state, dispatch } = useSocket();
  const { 
    warehouses = [], 
    docks = [], 
    waitingAreas = [], 
    selectedWarehouseId,
    deliveries = [],
    priorityQueue = [],
    dockOverrides: overrides = [] 
  } = state?.yms || {};
  
  const activeWarehouseId = selectedWarehouseId || warehouses[0]?.id || 'W01';
  const currentWarehouse = warehouses.find(w => w.id === activeWarehouseId);
  
  const filteredDocks = docks.filter(d => d.warehouseId === activeWarehouseId);
  const filteredWaitingAreas = waitingAreas.filter(wa => wa.warehouseId === activeWarehouseId);
  const filteredOverrides = overrides.filter(o => {
    const dock = docks.find(d => d.id === o.dockId);
    return dock?.warehouseId === activeWarehouseId;
  });

  // Actions
  const setSelectedWarehouse = (id: string) => dispatch('SELECT_WAREHOUSE', id);
  
  const updateDock = (dock: any) => dispatch('YMS_SAVE_DOCK', dock);
  
  const updateWaitingArea = (wa: any) => dispatch('YMS_SAVE_WAITINGAREA', wa);
  const deleteDock = (id: number, warehouseId: string) => dispatch('YMS_DELETE_DOCK', { id, warehouseId });
  const deleteWaitingArea = (id: number, warehouseId: string) => dispatch('YMS_DELETE_WAITINGAREA', { id, warehouseId });
  const updateDelivery = (d: any) => dispatch('YMS_SAVE_DELIVERY', d);
  const deleteDelivery = (id: string | number) => dispatch('YMS_DELETE_DELIVERY', id);

  const addWarehouse = (w: any) => dispatch('YMS_SAVE_WAREHOUSE', w);
  const updateWarehouse = (w: any) => dispatch('YMS_SAVE_WAREHOUSE', w);
  const deleteWarehouse = (id: string) => dispatch('YMS_DELETE_WAREHOUSE', id);

  const addOverride = (o: any) => dispatch('YMS_ADD_DOCK_OVERRIDE', o);
  const deleteOverride = (id: string) => dispatch('YMS_DELETE_DOCK_OVERRIDE', id);

  return {
    warehouses,
    docks: filteredDocks,
    allDocks: docks,
    waitingAreas: filteredWaitingAreas,
    allWaitingAreas: waitingAreas,
    overrides: filteredOverrides,
    deliveries,
    priorityQueue,
    selectedWarehouseId: activeWarehouseId,
    currentWarehouse,
    actions: {
      setSelectedWarehouse,
      updateDock,
      updateWaitingArea,
      updateDelivery,
      addWarehouse,
      updateWarehouse,
      deleteWarehouse,
      deleteDock,
      deleteWaitingArea,
      deleteDelivery,
      addOverride,
      deleteOverride
    }
  };
};
