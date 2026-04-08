import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSocket } from '../SocketContext';
import { Plus, Search, Download, Truck, LayoutDashboard, List } from 'lucide-react';
import { useDeliveries } from '../hooks/useDeliveries';
import { Skeleton, TableSkeleton, GridSkeleton } from './shared/SkeletonLoader';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { gatekeeperCheck } from '../lib/logistics';
import { cn } from '../lib/utils';
import { DeliveryTable } from './features/DeliveryTable';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { Input } from './shared/Input';
import { TransportMailModal } from './features/TransportMailModal';
import { DeliveryDetailModal } from './features/DeliveryDetailModal';

const DeliveryManager = ({ initialFilter = '', initialSelectedId }: { initialFilter?: string; initialSelectedId?: string }) => {
  const { state, dispatch, currentUser } = useSocket();
  const [filter, setFilter] = useState(initialFilter);
  const [typeFilter, setTypeFilter] = useState<'all' | 'container' | 'exworks'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<any>(null);
  const [mailDelivery, setMailDelivery] = useState<any>(null);
  const [lastAutoOpenedId, setLastAutoOpenedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const openModal = (d?: any) => {
    setEditingDelivery(d || null);
    setIsModalOpen(true);
  };

  const ITEMS_PER_PAGE = 20;
  const { deliveries, totalPages, loading } = useDeliveries(currentPage, ITEMS_PER_PAGE, filter, typeFilter, 'eta', true);

  useEffect(() => {
    const allDeliveries = state?.deliveries || [];
    if (initialSelectedId && allDeliveries.length > 0 && lastAutoOpenedId !== initialSelectedId) {
      const delivery = allDeliveries.find((d: any) => d.id === initialSelectedId);
      if (delivery) {
        setLastAutoOpenedId(initialSelectedId);
        const timer = setTimeout(() => {
          openModal(delivery);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [initialSelectedId, state?.deliveries, lastAutoOpenedId]);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const handleYmsRegister = (delivery: any) => {
    const error = gatekeeperCheck(delivery, 100);
    if (error) {
      toast.error(error);
      return;
    }

    const registrationTime = new Date().toISOString();
    const ymsId = Math.random().toString(36).substring(2, 11);

    const tempMap: Record<string, string> = {
      'Dry': 'Droog',
      'Cool': 'Koel',
      'Frozen': 'Vries'
    };

    dispatch('YMS_SAVE_DELIVERY', {
      id: ymsId,
      mainDeliveryId: delivery.id,
      warehouseId: delivery.warehouseId || 'W01',
      reference: delivery.reference,
      licensePlate: delivery.containerNumber || 'NR ONBEKEND',
      supplier: state?.addressBook?.suppliers.find((s:any) => s.id === delivery.supplierId)?.name || 'Onbekend',
      temperature: (tempMap[delivery.cargoType] || 'Droog') as any,
      isReefer: delivery.type === 'container',
      scheduledTime: delivery.etaWarehouse || delivery.eta || registrationTime,
      registrationTime: registrationTime,
      status: 'GATE_IN',
      transporterId: delivery.transporterId
    });
    dispatch('UPDATE_DELIVERY', { ...delivery, status: 100 });
    toast.success('Ingecheckt bij YMS.');
  };

  const handleExportCSV = () => {
    toast.info('Export wordt voorbereid...');
    // Demo logic: in a real app, this would generate a CSV blob and trigger download
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-4">
           <Skeleton variant="circle" />
           <div className="space-y-2">
              <Skeleton className="w-48 h-8" />
              <Skeleton className="w-64 h-4" />
           </div>
        </div>
        <Skeleton variant="row" className="h-20" />
        {viewMode === 'grid' ? <GridSkeleton count={6} /> : <TableSkeleton rows={10} />}
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Truck className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
             <h2 className="text-3xl font-bold text-foreground tracking-tight">Vrachtbeheer</h2>
             <p className="text-[var(--muted-foreground)] mt-1 font-medium text-sm">Beheer en volg de status van alle inkomende goederenstromen.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="secondary" leftIcon={<Download size={18} />} onClick={handleExportCSV}>Export</Button>
           {canEdit && <Button leftIcon={<Plus size={18} />} onClick={() => openModal()}>Nieuwe Vracht</Button>}
        </div>
      </header>

      {/* Filters */}
      <Card padding="md" className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
           <Input 
             placeholder="Zoek op referentie of leverancier..." 
             leftIcon={<Search size={18} />} 
             value={filter} 
             onChange={e => setFilter(e.target.value)} 
           />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
           {['all', 'container', 'exworks'].map(t => (
             <button
               key={t}
               onClick={() => setTypeFilter(t as any)}
               className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${typeFilter === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'}`}
             >
               {t === 'all' ? 'Alles' : t}
             </button>
           ))}
        </div>
        <div className="flex items-center gap-1 bg-[var(--muted)] p-1 rounded-xl ml-auto border border-border">
           <button 
             onClick={() => setViewMode('grid')}
             className={cn(
               "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-medium",
               viewMode === 'grid' 
                 ? "bg-card text-indigo-600 dark:text-white shadow-sm ring-1 ring-border" 
                 : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
             )}
           >
             <LayoutDashboard size={14} />
             <span>Kaarten</span>
           </button>
           <button 
             onClick={() => setViewMode('list')}
             className={cn(
               "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-medium",
               viewMode === 'list' 
                 ? "bg-card text-indigo-600 dark:text-white shadow-sm ring-1 ring-border" 
                 : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
             )}
           >
             <List size={14} />
             <span>Tabel</span>
           </button>
        </div>
      </Card>

      <section className="space-y-6">
      <LayoutGroup>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card padding="none" className="overflow-hidden">
              <DeliveryTable 
                viewMode={viewMode}
                deliveries={deliveries}
                selectedIds={selectedIds}
                onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                onToggleSelectAll={() => setSelectedIds(selectedIds.length === deliveries.length ? [] : deliveries.map(d => d.id))}
                onOpenModal={(d) => openModal(d)}
                onDelete={(id) => confirm('Weet je zeker dat je deze levering wilt verwijderen?') && dispatch('DELETE_DELIVERY', id)}
                onMailTransport={(d) => setMailDelivery(d)}
                onYmsRegister={handleYmsRegister}
                onUpdateStatus={(d, s) => {
                  const error = gatekeeperCheck(d, s);
                  if (error) {
                    toast.error(error);
                    return;
                  }
                  dispatch('UPDATE_DELIVERY', { ...d, status: s });
                }}
                canEdit={canEdit}
                suppliers={state?.addressBook?.suppliers || []}
              />
            </Card>
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
             {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i+1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-card border border-border text-[var(--muted-foreground)] hover:border-indigo-500'}`}
                >
                  {i + 1}
                </button>
             ))}
          </div>
        )}
      </section>

      {/* Shared Delivery Modal */}
      <DeliveryDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        delivery={editingDelivery}
        onSave={(data) => {
          let documents = [...(data.documents || [])];
          
          if (!editingDelivery) {
             if (data.type === 'container') {
                documents = [
                  { id: 'd1', name: 'Packing List', status: 'pending', required: false },
                  { id: 'd2', name: 'Invoice', status: 'pending', required: false },
                  { id: 'd3', name: 'Certificate of Origin', status: 'pending', required: false },
                  { id: 'd4', name: 'SWB / Bill of Lading', status: 'pending', required: true },
                  { id: 'd5', name: 'NOA (Notification of Arrival)', status: 'pending', required: true }
                ];
             } else {
                documents = [
                  { id: 'd1', name: 'Transport Order', status: 'pending', required: true }
                ];
             }
          }

          const finalData = {
            ...data,
            id: editingDelivery?.id || Math.random().toString(36).substr(2, 9),
            status: editingDelivery?.status || 0,
            documents,
            updatedAt: new Date().toISOString(),
            createdAt: editingDelivery?.createdAt || new Date().toISOString()
          };

          dispatch(editingDelivery ? 'UPDATE_DELIVERY' : 'ADD_DELIVERY', finalData);
          setIsModalOpen(false);
          toast.success(editingDelivery ? 'Vracht bijgewerkt.' : 'Vracht aangemaakt.');
        }}
      />

      <TransportMailModal 
        isOpen={!!mailDelivery}
        onClose={() => setMailDelivery(null)}
        delivery={mailDelivery}
        transporter={state.addressBook?.transporters?.find((t: any) => t.id === mailDelivery?.transporterId)}
        supplier={state.addressBook?.suppliers?.find((s: any) => s.id === mailDelivery?.supplierId)}
      />
    </div>
  );
};

export default DeliveryManager;
