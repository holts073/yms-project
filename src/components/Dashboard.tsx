import React, { useState, useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { useSocket } from '../SocketContext';
import { useDeliveries } from '../hooks/useDeliveries';
import { DashboardKPIs } from './features/DashboardKPIs';
import { DashboardTable } from './features/DashboardTable';
import { Card } from './shared/Card';
import { TransportMailModal } from './features/TransportMailModal';
import { DeliveryDetailModal } from './features/DeliveryDetailModal';

const Dashboard = ({ onNavigate }: { onNavigate?: (tab: string, reference?: string, id?: string) => void }) => {
  const { state, dispatch, currentUser } = useSocket();
  const { deliveries } = useDeliveries(1, 1000, '', 'all', 'eta', true);
  const [filterType, setFilterType] = useState<'action' | 'today' | 'enroute' | 'customs' | 'in_transit'>('action');
  const [mailDelivery, setMailDelivery] = useState<any>(null);
  const [editingDelivery, setEditingDelivery] = useState<any>(null);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Calculate Stats
  const stats = useMemo(() => {
    const actionRequired = deliveries.filter(d => d.status < 100 && d.documents.some(doc => doc.required && doc.status === 'missing')).length;
    const today = new Date().toISOString().split('T')[0];
    const enRoute = deliveries.filter(d => d.status >= 75 && d.status < 100).length;
    const customs = deliveries.filter(d => d.status >= 50 && d.status < 75).length;
    const inTransit = deliveries.filter(d => d.status >= 25 && d.status < 50).length;
    
    // YMS Stats
    const yms = state?.yms || { deliveries: [], docks: [], waitingAreas: [] };
    const arrivalsNoDock = yms.deliveries.filter(d => d.status === 'GATE_IN' && !d.dockId).length;
    const now = new Date();
    const plannedDockDelays = yms.deliveries.filter(d => d.status === 'PLANNED' && d.dockId && new Date(d.scheduledTime) < now).length;
    const totalDocks = yms.docks.length;
    const occupiedDocks = yms.docks.filter(d => d.status !== 'Available').length;
    const dockOccupancy = totalDocks > 0 ? Math.round((occupiedDocks / totalDocks) * 100) : 0;
    
    const occupiedWaitingAreas = yms.waitingAreas.filter(wa => wa.status !== 'Available').length;
    const yardOccupancy = yms.waitingAreas.length > 0 ? Math.round((occupiedWaitingAreas / yms.waitingAreas.length) * 100) : 0;
    const lateArrivals = yms.deliveries.filter(d => d.isLate).length;

    // Average turnaround (simplified)
    const completedToday = yms.deliveries.filter(d => d.status === 'GATE_OUT' && d.statusTimestamps?.GATE_IN && d.statusTimestamps?.GATE_OUT.startsWith(today));
    const avgTime = completedToday.length > 0 ? Math.round(completedToday.reduce((acc, d) => acc + (new Date(d.statusTimestamps!.GATE_OUT!).getTime() - new Date(d.statusTimestamps!.GATE_IN!).getTime()) / 60000, 0) / completedToday.length) : 0;

    return {
      actionRequired, enRoute, inTransit, customs,
      arrivalsNoDock, plannedDockDelays, dockOccupancy, occupiedDocks, totalDocks,
      averageTurnaroundTime: avgTime, yardOccupancy, lateArrivals, occupiedWaitingAreas, totalWaitingAreas: yms.waitingAreas.length
    };
  }, [deliveries, state?.yms]);

  const displayedDeliveries = useMemo(() => {
    if (filterType === 'action') return deliveries.filter(d => d.status < 100 && d.documents.some(doc => doc.required && doc.status === 'missing'));
    if (filterType === 'enroute') return deliveries.filter(d => d.status >= 75 && d.status < 100);
    if (filterType === 'customs') return deliveries.filter(d => d.status >= 50 && d.status < 75);
    if (filterType === 'in_transit') return deliveries.filter(d => d.status >= 25 && d.status < 50);
    const today = new Date().toISOString().split('T')[0];
    return deliveries.filter(d => d.status < 100 && (d.etaWarehouse === today || d.eta === today));
  }, [deliveries, filterType]);

  const handleYmsRegister = (delivery: any) => {
    const existingYms = state?.yms?.deliveries.find(yd => yd.reference === delivery.reference);
    const ymsId = existingYms?.id || Math.random().toString(36).substr(2, 9);
    const registrationTime = new Date().toISOString();
    
    dispatch('YMS_SAVE_DELIVERY', {
      id: ymsId,
      mainDeliveryId: delivery.id,
      warehouseId: 'W01',
      reference: delivery.reference,
      licensePlate: delivery.containerNumber || 'NR ONBEKEND',
      supplier: state?.addressBook?.suppliers.find(s => s.id === delivery.supplierId)?.name || 'Onbekend',
      temperature: delivery.cargoType || 'Droog',
      isReefer: delivery.type === 'container' ? 1 : 0,
      scheduledTime: delivery.etaWarehouse || delivery.eta || registrationTime,
      registrationTime: registrationTime,
      status: 'GATE_IN',
      transporterId: delivery.transporterId
    });
    
    dispatch('UPDATE_DELIVERY', { ...delivery, status: 100 });
    toast.success('Ingecheckt bij YMS.');
  };

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight italic uppercase">Supply Chain Dashboard</h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium tracking-widest uppercase text-xs">Real-time overzicht van logistieke operaties en yard management.</p>
          </div>
        </div>
      </header>

      <DashboardKPIs stats={stats} filterType={filterType} onFilterChange={setFilterType} onNavigate={(tab) => onNavigate?.(tab)} />

      <section className="space-y-6">
        <h3 className="text-xl font-black text-foreground uppercase tracking-tight px-4">
          {filterType === 'action' ? 'Actie Vereist' : 
           (filterType === 'enroute' ? 'Onderweg naar Magazijn' : 
           (filterType === 'customs' ? 'DOUANE / Inklaringsproces' : 
           (filterType === 'in_transit' ? 'In Transit' : 'Verwacht Vandaag')))}
        </h3>
        <Card padding="none" className="overflow-hidden">
          <DashboardTable 
            deliveries={displayedDeliveries}
            suppliers={state?.addressBook?.suppliers || []}
            onSelect={(id) => {
              const delivery = deliveries.find(d => d.id === id);
              if (delivery) setEditingDelivery(delivery);
            }}
            onYmsRegister={handleYmsRegister}
            onMailTransport={(d) => setMailDelivery(d)}
            onUpdateStatus={(d, s) => dispatch('UPDATE_DELIVERY', { ...d, status: s })}
            canEdit={canEdit}
            borderless
          />

          <DeliveryDetailModal 
            isOpen={!!editingDelivery}
            onClose={() => setEditingDelivery(null)}
            delivery={editingDelivery}
            state={state}
            onSave={(data) => {
              dispatch('UPDATE_DELIVERY', data);
              setEditingDelivery(null);
              toast.success('Levering bijgewerkt.');
            }}
          />
        </Card>
      </section>

      <TransportMailModal 
        isOpen={!!mailDelivery}
        onClose={() => setMailDelivery(null)}
        delivery={mailDelivery}
        transporter={state?.addressBook?.transporters?.find((t: any) => t.id === mailDelivery?.transporterId)}
        supplier={state?.addressBook?.suppliers?.find((s: any) => s.id === mailDelivery?.supplierId)}
      />
    </div>
  );
};

export default Dashboard;
