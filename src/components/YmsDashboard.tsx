import React, { useState, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { useYmsData } from '../hooks/useYmsData';
import { useDeliveries } from '../hooks/useDeliveries';
import { useTheme } from '../ThemeContext';
import { YmsHeader } from './features/YmsHeader';
import { YmsStats } from './features/YmsStats';
import { YmsDockGrid } from './features/YmsDockGrid';
import { YmsWaitingAreaGrid } from './features/YmsWaitingAreaGrid';
import { YmsTimeline } from './features/YmsTimeline';
import { YmsDeliveryList } from './features/YmsDeliveryList';
import { YmsArrivalsList } from './features/YmsArrivalsList';
import { YmsAssignmentModal } from './features/YmsAssignmentModal';
import { YmsDeliveryModal } from './features/YmsDeliveryModal';
import { YmsDelivery, YmsDeliveryStatus } from '../types';
import { FullPageLoader } from './shared/LoadingSpinner';

export default function YmsDashboard({ view = 'planning' }: { view?: 'arrivals' | 'planning' }) {
  const { state } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const yms = useYmsData();
  const { deliveries, actions: deliveryActions } = useDeliveries();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingDelivery, setEditingDelivery] = useState<Partial<YmsDelivery> | null>(null);
  const [assigningDelivery, setAssigningDelivery] = useState<YmsDelivery | null>(null);

  // Derived state
  const filteredDeliveries = useMemo(() => {
    return yms.deliveries.filter((d: YmsDelivery) => 
      d.warehouseId === yms.selectedWarehouseId && 
      (d.scheduledTime.startsWith(selectedDate) || ['GATE_IN', 'IN_YARD', 'DOCKED', 'UNLOADING', 'LOADING'].includes(d.status)) &&
      (d.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || d.supplier?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [yms.deliveries, yms.selectedWarehouseId, selectedDate, searchTerm]);

  const stats = useMemo(() => ({
    totalDeliveries: filteredDeliveries.length,
    activeDocks: yms.docks.filter(d => d.status === 'Occupied').length,
    totalDocks: yms.docks.length,
    waitingVehicles: filteredDeliveries.filter(d => d.status === 'GATE_IN' && !d.dockId).length,
    alertsCount: state?.yms?.alerts?.length || 0
  }), [filteredDeliveries, yms.docks, state]);

  if (!state) return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 font-sans space-y-10">
      <YmsHeader 
        title="Yard Management"
        subtitle="Real-time overzicht van je logistieke yard"
        warehouses={yms.warehouses}
        selectedWarehouseId={yms.selectedWarehouseId || ''}
        onSelectWarehouse={yms.actions.setSelectedWarehouse}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onNewDelivery={() => setEditingDelivery({})}
      />

      <YmsStats stats={stats} />

      {view === 'arrivals' ? (
        <YmsArrivalsList 
          deliveries={filteredDeliveries}
          docks={yms.docks}
          waitingAreas={yms.waitingAreas}
          onAssignClick={setAssigningDelivery}
        />
      ) : (
        <div className="flex flex-col gap-10">
          <section className="space-y-6">
            <h3 className="text-2xl font-black text-foreground">Docks & Planning</h3>
            <YmsTimeline 
              docks={yms.docks}
              deliveries={filteredDeliveries}
              onSaveDelivery={deliveryActions.updateDelivery as any}
              getStatusLabel={(s) => s}
              isToday={selectedDate === new Date().toISOString().split('T')[0]}
            />
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            <div className="xl:col-span-2 space-y-6">
              <h3 className="text-2xl font-black text-foreground">Actieve Leveringen</h3>
              <YmsDeliveryList 
                deliveries={filteredDeliveries}
                docks={yms.docks}
                waitingAreas={yms.waitingAreas}
                getStatusLabel={(s) => s}
                onUpdateStatus={deliveryActions.updateDeliveryStatus}
                onAssignDock={(d, id) => deliveryActions.assignDock(d.id, id)}
                onAssignWaitingArea={(d, id) => deliveryActions.updateDelivery({ ...d, waitingAreaId: id, status: 'IN_YARD' })}
                onRegisterExpected={deliveryActions.registerArrival as any}
                onEdit={setEditingDelivery}
              />
            </div>
            <div className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-foreground">Dock Status</h3>
                <YmsDockGrid docks={yms.docks} onUpdateDock={yms.actions.updateDock} />
              </div>
              
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-foreground">Wachtruimtes</h3>
                <YmsWaitingAreaGrid waitingAreas={yms.waitingAreas} onUpdateStatus={(wa, s) => yms.actions.updateWaitingArea({ ...wa, adminStatus: s })} />
              </div>
            </div>
          </div>
        </div>
      )}

      <YmsDeliveryModal 
        isOpen={!!editingDelivery}
        onClose={() => setEditingDelivery(null)}
        delivery={editingDelivery}
        onSave={(d) => { deliveryActions.addDelivery(d); setEditingDelivery(null); }}
        onUpdateEditing={setEditingDelivery}
        suppliers={state.addressBook?.suppliers || []}
        transporters={state.addressBook?.transporters || []}
        warehouses={yms.warehouses}
        docks={yms.allDocks}
        waitingAreas={yms.allWaitingAreas}
      />
      
      <YmsAssignmentModal 
        isOpen={!!assigningDelivery}
        onClose={() => setAssigningDelivery(null)}
        delivery={assigningDelivery}
        docks={yms.docks}
        waitingAreas={yms.waitingAreas}
        onAssignDock={(id) => { deliveryActions.assignDock(assigningDelivery!.id, id); setAssigningDelivery(null); }}
        onAssignWaitingArea={(id) => { deliveryActions.updateDelivery({ ...assigningDelivery!, waitingAreaId: id, status: 'IN_YARD' }); setAssigningDelivery(null); }}
      />
    </div>
  );
}
