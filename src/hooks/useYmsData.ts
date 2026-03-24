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
    dockOverrides: overrides = [] 
  } = state?.yms || {};

  const currentWarehouse = warehouses.find(w => w.id === selectedWarehouseId);
  
  const filteredDocks = docks.filter(d => d.warehouseId === selectedWarehouseId);
  const filteredWaitingAreas = waitingAreas.filter(wa => wa.warehouseId === selectedWarehouseId);
  const filteredOverrides = overrides.filter(o => {
    const dock = docks.find(d => d.id === o.dockId);
    return dock?.warehouseId === selectedWarehouseId;
  });

  // Actions
  const setSelectedWarehouse = (id: string) => dispatch('SELECT_WAREHOUSE', id);
  
  const updateDock = (dock: any) => dispatch('YMS_SAVE_DOCK', dock);
  
  const updateWaitingArea = (wa: any) => dispatch('YMS_SAVE_WAITINGAREA', wa);

  const addWarehouse = (w: any) => dispatch('YMS_SAVE_WAREHOUSE', w);
  const updateWarehouse = (w: any) => dispatch('YMS_SAVE_WAREHOUSE', w);
  const deleteWarehouse = (id: string) => dispatch('YMS_DELETE_WAREHOUSE', id);

  const addOverride = (o: any) => dispatch('YMS_ADD_DOCK_OVERRIDE', o);
  const deleteOverride = (id: string) => dispatch('Y_DELETE_DOCK_OVERRIDE', id);

  return {
    warehouses,
    docks: filteredDocks,
    allDocks: docks,
    waitingAreas: filteredWaitingAreas,
    allWaitingAreas: waitingAreas,
    overrides: filteredOverrides,
    deliveries,
    selectedWarehouseId,
    currentWarehouse,
    actions: {
      setSelectedWarehouse,
      updateDock,
      updateWaitingArea,
      addWarehouse,
      updateWarehouse,
      deleteWarehouse,
      addOverride,
      deleteOverride
    }
  };
};
