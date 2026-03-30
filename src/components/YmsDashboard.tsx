import React, { useState, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { useYmsData } from '../hooks/useYmsData';
import { useDeliveries } from '../hooks/useDeliveries';
import { useTheme } from '../ThemeContext';
import { YmsHeader } from './features/YmsHeader';
import { YmsStats } from './features/YmsStats';
import { YmsDockGrid } from './features/YmsDockGrid';
import { YmsWaitingAreaGrid } from './features/YmsWaitingAreaGrid';
import { YmsTimeline } from './features/YmsTimeline';
import { YmsDeliveryList } from './features/YmsDeliveryList';
import { YmsQueue } from './features/YmsQueue';
import { YmsAssignmentModal } from './features/YmsAssignmentModal';
import { YmsDeliveryModal } from './features/YmsDeliveryModal';
import { YmsCapacityStats } from './features/YmsCapacityStats';
import { WarehouseSettingsModal } from './features/WarehouseSettingsModal';
import { YmsDelivery, YmsDeliveryStatus, YmsWarehouse } from '../types';
import { FullPageLoader } from './shared/LoadingSpinner';
import { Skeleton, GridSkeleton, TableSkeleton } from './shared/SkeletonLoader';
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragStartEvent 
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Truck } from 'lucide-react';

export default function YmsDashboard({ view = 'planning', onBack }: { view?: 'arrivals' | 'planning', onBack?: () => void }) {
  const { state } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const yms = useYmsData();
  const { deliveries, actions: deliveryActions } = useDeliveries();
  
  const [searchTerm, setSearchTerm] = useState('');

  const handleYmsStatusUpdate = (delivery: any, status: any) => {
    // 1. Update YMS record
    if (delivery.temperature || delivery.warehouseId) {
      const updated = { ...delivery, status };
      yms.actions.updateDelivery(updated);
      
      // 2. Coordinated update to Main Tracker if linked
      if (delivery.mainDeliveryId) {
         if (status === 'COMPLETED') {
           deliveryActions.updateDeliveryStatus(delivery.mainDeliveryId, 100);
         } else if (status === 'UNLOADING' || status === 'LOADING') {
           deliveryActions.updateDeliveryStatus(delivery.mainDeliveryId, 90);
         }
      }
    } else {
      // Standard delivery update
      deliveryActions.updateDeliveryStatus(delivery.id, status);
    }
  };
  const [directionFilter, setDirectionFilter] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingDelivery, setEditingDelivery] = useState<Partial<YmsDelivery> | null>(null);
  const [assigningDelivery, setAssigningDelivery] = useState<YmsDelivery | null>(null);
  const [isWarehouseSettingsOpen, setIsWarehouseSettingsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // E2E Synchronization helper
  React.useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.type === 'YMS_SET_SELECTED_DATE') {
        setSelectedDate(e.detail.payload);
      }
    };
    window.addEventListener('YMS_ACTION', handleSync);
    return () => window.removeEventListener('YMS_ACTION', handleSync);
  }, []);

  // Derived state
  const filteredDeliveries = useMemo(() => {
    return yms.deliveries.filter((d: YmsDelivery) => 
      d.warehouseId === yms.selectedWarehouseId && 
      (d.direction === directionFilter || view === 'planning') && 
      // Planning view shows everything for that date. 
      // Arrivals view (yard) only shows non-terminal statuses OR today's completed items.
      (view === 'planning' 
        ? (d.scheduledTime && d.scheduledTime.startsWith(selectedDate))
        : (['GATE_IN', 'IN_YARD', 'DOCKED', 'UNLOADING', 'LOADING', 'COMPLETED'].includes(d.status) || 
           (d.status === 'GATE_OUT' && d.statusTimestamps?.GATE_OUT?.startsWith(new Date().toISOString().split('T')[0])))
      ) &&
      (d.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || d.supplier?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [yms.deliveries, yms.selectedWarehouseId, selectedDate, searchTerm, directionFilter, view]);

  const stats = useMemo(() => ({
    totalDeliveries: filteredDeliveries.filter(d => !['COMPLETED', 'GATE_OUT'].includes(d.status)).length,
    activeDocks: yms.docks.filter(d => d.status === 'Occupied').length,
    totalDocks: yms.docks.length,
    waitingVehicles: filteredDeliveries.filter(d => d.status === 'GATE_IN' && !d.dockId).length,
    alertsCount: state?.yms?.alerts?.length || 0
  }), [filteredDeliveries, yms.docks, state]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const delivery = yms.deliveries.find(d => d.id === active.id);
    if (!delivery) return;

    if (over.data.current?.type === 'dock-cell') {
      const { dockId, time } = over.data.current;
      deliveryActions.assignDock(delivery.id, Number(dockId), time);
    }
  };

  if (yms.warehouses.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-10">
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <Skeleton className="h-10 w-64 rounded-xl" />
                <Skeleton className="h-4 w-96 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-[2.5rem]" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
           <div className="xl:col-span-2 space-y-6">
              <h3 className="text-2xl font-black text-foreground">Aankomst Wachtrij</h3>
              <ErrorBoundary fallbackTitle="Wachtrij Fout">
                <YmsQueue onAssignClick={setAssigningDelivery} />
              </ErrorBoundary>
           </div>
           <div className="space-y-10">
              <h3 className="text-2xl font-black text-foreground">Wachtruimte Status</h3>
              <ErrorBoundary fallbackTitle="Wachtruimte Fout">
                <YmsWaitingAreaGrid />
              </ErrorBoundary>
           </div>
        </div>
      </div>
    );
  }

  const activeDelivery = activeId ? yms.deliveries.find(d => d.id === activeId) : null;

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
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
        onNewDelivery={() => setEditingDelivery({ warehouseId: yms.selectedWarehouseId || undefined })}
        onWarehouseSettings={() => setIsWarehouseSettingsOpen(true)}
        onBack={onBack}
      />

      <div className="flex gap-4 p-2 bg-card rounded-[2rem] border border-border w-fit shadow-sm">
        <button
          onClick={() => setDirectionFilter('INBOUND')}
          data-testid="nav-inbound"
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest transition-all ${
            directionFilter === 'INBOUND' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50'
          }`}
        >
          Inbound (Leveringen)
        </button>
        <button
          onClick={() => setDirectionFilter('OUTBOUND')}
          data-testid="nav-outbound"
          className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest transition-all ${
            directionFilter === 'OUTBOUND' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50'
          }`}
        >
          Outbound (Klantzendingen)
        </button>
      </div>

      <YmsStats stats={stats} />

      {view === 'arrivals' ? (
            <YmsQueue 
              onAssignClick={setAssigningDelivery} 
            />
      ) : (
        <div className="flex flex-col gap-10">
          <section className="space-y-6 flex flex-col h-[600px]">
            <div className="flex items-center justify-between">
              <h3 data-testid="page-title" className="text-2xl font-black text-foreground">Docks & Planning</h3>
              <YmsCapacityStats />
            </div>
            <ErrorBoundary fallbackTitle="Timeline Fout">
              <YmsTimeline 
                deliveries={filteredDeliveries}
                onSaveDelivery={yms.actions.updateDelivery}
                getStatusLabel={(s) => s}
                isToday={selectedDate === new Date().toISOString().split('T')[0]}
                selectedDate={selectedDate}
              />
            </ErrorBoundary>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-2 space-y-4">
              <h3 data-testid="page-title" className="text-xl font-black text-foreground tracking-tight">Actieve Leveringen</h3>
              <ErrorBoundary fallbackTitle="Leveringenlijst Fout">
                <YmsDeliveryList 
                  deliveries={filteredDeliveries}
                  getStatusLabel={(s) => s}
                  onUpdateStatus={handleYmsStatusUpdate}
                  onAssignDock={(d, id) => deliveryActions.assignDock(d.id, Number(id))}
                  onAssignWaitingArea={(d, id) => yms.actions.updateDelivery({ ...d, waitingAreaId: Number(id), status: 'IN_YARD' })}
                  onRegisterExpected={(d) => {
                    if (yms.currentWarehouse && !yms.currentWarehouse.hasGate) {
                      setAssigningDelivery(d);
                    } else {
                      deliveryActions.registerArrival(d.id);
                    }
                  }}
                  onEdit={setEditingDelivery}
                  onAssignClick={setAssigningDelivery}
                />
              </ErrorBoundary>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-black text-foreground tracking-tight">Dock Status</h3>
              <ErrorBoundary fallbackTitle="Dock Fout">
                <YmsDockGrid />
              </ErrorBoundary>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-black text-foreground tracking-tight">Wachtruimtes</h3>
              <ErrorBoundary fallbackTitle="Wachtruimte Fout">
                <YmsWaitingAreaGrid />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}

      <YmsDeliveryModal 
        isOpen={!!editingDelivery}
        onClose={() => setEditingDelivery(null)}
        delivery={editingDelivery}
        onSave={(d) => { yms.actions.updateDelivery(d); setEditingDelivery(null); }}
        onUpdateEditing={setEditingDelivery}
        suppliers={state.addressBook?.suppliers || []}
        transporters={state.addressBook?.transporters || []}
        warehouses={yms.warehouses}
        docks={yms.docks}
        waitingAreas={yms.waitingAreas}
      />
      
      <YmsAssignmentModal 
        isOpen={!!assigningDelivery}
        onClose={() => setAssigningDelivery(null)}
        delivery={assigningDelivery}
        docks={yms.docks}
        waitingAreas={yms.waitingAreas}
        onAssignDock={(id, time) => { deliveryActions.assignDock(assigningDelivery!.id, id, time); setAssigningDelivery(null); }}
        onAssignWaitingArea={(id) => { yms.actions.updateDelivery({ ...assigningDelivery!, waitingAreaId: id, status: 'IN_YARD' }); setAssigningDelivery(null); }}
      />

      <WarehouseSettingsModal 
        isOpen={isWarehouseSettingsOpen}
        onClose={() => setIsWarehouseSettingsOpen(false)}
        warehouse={yms.currentWarehouse || null}
        onSave={(w) => yms.actions.updateWarehouse(w)}
      />

      <DragOverlay>
        {activeId && activeDelivery ? (
          <div className="bg-card border-2 border-indigo-500 rounded-2xl p-4 shadow-2xl flex items-center gap-3 w-64 opacity-90 scale-105 pointer-events-none">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <Truck size={20} />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{activeDelivery.reference}</p>
              <p className="text-[10px] font-mono text-[var(--muted-foreground)] font-bold uppercase">{activeDelivery.licensePlate || 'NR ONBEKEND'}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  );
}
