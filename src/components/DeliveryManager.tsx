import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useSocket } from '../SocketContext';
import { Plus, Search, Download, Truck, LayoutDashboard, List, Package, AlertCircle } from 'lucide-react';
import { useDeliveries } from '../hooks/useDeliveries';
import { Skeleton, TableSkeleton, GridSkeleton } from './shared/SkeletonLoader';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { gatekeeperCheck } from '../lib/logistics';
import { cn } from '../lib/utils';
import { Badge } from './shared/Badge';
import { DeliveryTable } from './features/DeliveryTable';
import { Modal } from './shared/Modal';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { Input } from './shared/Input';
import { Combobox } from './ui/Combobox';
import { TransportMailModal } from './features/TransportMailModal';

const ComboboxWrapper = ({ name, options, defaultValue, placeholder }: any) => {
  const [val, setVal] = useState(defaultValue || (options.length > 0 ? options[0].value : ''));
  return (
    <>
      <input type="hidden" name={name} value={val} />
      <Combobox options={options} value={val} onChange={setVal} placeholder={placeholder} />
    </>
  );
};

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
  const [formType, setFormType] = useState<'container' | 'exworks'>('container');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const openModal = (d?: any) => {
    setEditingDelivery(d || null);
    setFormType(d?.type || 'container');
    setIsModalOpen(true);
  };

  const ITEMS_PER_PAGE = 20;
  const { deliveries, totalPages, loading } = useDeliveries(currentPage, ITEMS_PER_PAGE, filter, typeFilter, 'eta', true);

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

  useEffect(() => {
    // FIX: Search all deliveries in state, not just the paginated slice
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
      warehouseId: 'W01',
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
    // Logic as before
  };

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
             // noMargin safely destructured in Input.tsx
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
                onDelete={(id) => dispatch('DELETE_DELIVERY', id)}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDelivery ? 'Vracht Bewerken' : 'Nieuwe Vracht'} maxWidth="4xl">
         <form 
           onSubmit={(e) => {
             e.preventDefault();
             const formData = new FormData(e.currentTarget);
             const data = Object.fromEntries(formData.entries());
              const documents = editingDelivery?.documents || [];
              const isScanRequired = data.isScanRequired === 'on';

              if (!editingDelivery && documents.length === 0) {
                if (formType === 'container') {
                  documents.push(
                    { id: 'd1', name: 'Packing List', status: 'pending', required: false },
                    { id: 'd2', name: 'Invoice', status: 'pending', required: false },
                    { id: 'd3', name: 'Certificate of Origin', status: 'pending', required: false },
                    { id: 'd4', name: 'SWB / Bill of Lading', status: 'pending', required: true },
                    { id: 'd5', name: 'NOA (Notification of Arrival)', status: 'pending', required: true }
                  );
                } else {
                  documents.push(
                    { id: 'd1', name: 'Transport Order', status: 'pending', required: true }
                  );
                }
              }

              // Handle Scan Release document
              const hasScanDoc = documents.some(d => d.name.toLowerCase().includes('scan'));
              if (isScanRequired && !hasScanDoc) {
                documents.push({ id: `scan-${Date.now()}`, name: 'Scan Release (Douane)', status: 'pending', required: true });
              } else if (!isScanRequired && hasScanDoc) {
                const idx = documents.findIndex(d => d.name.toLowerCase().includes('scan'));
                if (idx > -1) documents.splice(idx, 1);
              }

              const finalData = {
                ...editingDelivery,
                ...data,
                id: editingDelivery?.id || Math.random().toString(36).substr(2, 9),
                status: editingDelivery?.status || 0,
                palletCount: parseInt(data.palletCount as string) || 0,
                palletRate: parseFloat(data.palletRate as string) || 0,
                documents,
                updatedAt: new Date().toISOString(),
                createdAt: editingDelivery?.createdAt || new Date().toISOString()
              };
             dispatch(editingDelivery ? 'UPDATE_DELIVERY' : 'ADD_DELIVERY', finalData);
             setIsModalOpen(false);
             toast.success(editingDelivery ? 'Vracht bijgewerkt.' : 'Vracht aangemaakt.');
           }}
           className="space-y-6"
         >
             <div className="grid grid-cols-2 gap-6">
               <Input label="Referentie" name="reference" defaultValue={editingDelivery?.reference} required />
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Type</label>
                  <select name="type" value={formType} onChange={(e) => setFormType(e.target.value as any)} className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold focus:ring-2 outline-none">
                     <option value="container">Container</option>
                     <option value="exworks">Ex-Works</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Leverancier</label>
                  <ComboboxWrapper 
                    name="supplierId" 
                    defaultValue={editingDelivery?.supplierId} 
                    options={(state.addressBook?.suppliers || []).map((s:any) => ({ value: s.id, label: s.name }))}
                    placeholder="Zoek leverancier..." 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Transporteur</label>
                  <ComboboxWrapper 
                    name="transporterId" 
                    defaultValue={editingDelivery?.transporterId} 
                    options={(state.addressBook?.transporters || []).map((s:any) => ({ value: s.id, label: s.name }))}
                    placeholder="Zoek transporteur..." 
                  />
               </div>
               <Input label="ETA Magazijn" name="etaWarehouse" type="date" defaultValue={editingDelivery?.etaWarehouse?.split('T')[0]} />
               
                <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Incoterms</label>
                   <select name="incoterm" defaultValue={editingDelivery?.incoterm || 'EXW'} className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold">
                      <option value="EXW">EXW</option>
                      <option value="FCA">FCA</option>
                      <option value="FOB">FOB</option>
                      <option value="CIF">CIF</option>
                      <option value="DDP">DDP</option>
                      <option value="DAP">DAP</option>
                   </select>
                </div>

                {formType === 'container' && (
                  <>
                    <Input label="Container nummer" name="containerNumber" defaultValue={editingDelivery?.containerNumber} />
                    <Input label="Bill of Lading (B/L)" name="billOfLading" type="number" defaultValue={editingDelivery?.billOfLading} />
                    <Input label="Haven van Aankomst" name="portOfArrival" defaultValue={editingDelivery?.portOfArrival} />
                    <Input label="ETA Haven" name="etaPort" type="date" defaultValue={editingDelivery?.etaPort?.split('T')[0]} />
                    <div className="flex items-center gap-3 pt-6 pl-4">
                       <input 
                         type="checkbox" 
                         name="isScanRequired" 
                         id="isScanRequired" 
                         defaultChecked={editingDelivery?.documents?.some((d:any) => d.name.toLowerCase().includes('scan'))} 
                         className="w-5 h-5 rounded border-border text-rose-600 focus:ring-rose-500" 
                       />
                       <label htmlFor="isScanRequired" className="text-sm font-bold text-foreground">DOUANE Scan benodigd</label>
                    </div>
                  </>
                )}

                {formType === 'exworks' && (
                  <>
                    <Input label="Kenteken" name="containerNumber" defaultValue={editingDelivery?.containerNumber} />
                    <Input label="Laadstad" name="loadingCity" defaultValue={editingDelivery?.loadingCity} />
                    <Input label="Laadland" name="loadingCountry" defaultValue={editingDelivery?.loadingCountry} />
                  </>
                )}
                <div className="grid grid-cols-2 gap-6">
                   <Input label="Aantal Pallets" name="palletCount" type="number" defaultValue={editingDelivery?.palletCount} />
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Lading Type</label>
                      <select name="cargoType" defaultValue={editingDelivery?.cargoType || 'Dry'} className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold">
                         <option value="Dry">Droog</option>
                         <option value="Cool">Koel</option>
                         <option value="Frozen">Vries</option>
                      </select>
                   </div>
                </div>
                <Input label="Gewicht (kg)" name="weight" type="number" defaultValue={editingDelivery?.weight} />
                <div className="space-y-4 bg-card/50 p-4 rounded-2xl border border-border mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Pallet Type</label>
                       <select 
                         name="palletType" 
                         defaultValue={editingDelivery?.palletType || 'EUR'} 
                         className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold"
                         onChange={(e) => {
                           const rates: any = state.settings?.pallet_rates || { 'EUR': 13, 'DPD': 22.5, 'CHEP': 0, 'BLOK': 15 };
                           const rateInput = document.getElementById('palletRate') as HTMLInputElement;
                           if (rateInput) rateInput.value = rates[e.target.value] || '0';
                         }}
                       >
                          <option value="EUR">EUR (€{(state.settings?.pallet_rates?.EUR || 13).toFixed(2)})</option>
                          <option value="DPD">DPD (€{(state.settings?.pallet_rates?.DPD || 22.5).toFixed(2)})</option>
                          <option value="CHEP">CHEP (€{(state.settings?.pallet_rates?.CHEP || 0).toFixed(2)})</option>
                          <option value="BLOK">BLOK (€{(state.settings?.pallet_rates?.BLOK || 15).toFixed(2)})</option>
                       </select>
                    </div>
                    <Input 
                      label="Tarief (€)" 
                      name="palletRate" 
                      id="palletRate"
                      type="number" 
                      step="0.01" 
                      defaultValue={editingDelivery?.palletRate || 13} 
                    />
                  </div>
                </div>
                <Input 
                   as="textarea"
                   label="Opmerkingen" 
                   name="notes" 
                   containerClassName="col-span-2"
                   defaultValue={editingDelivery?.notes} 
                   placeholder="Voeg eventuele instructies of bijzonderheden toe..."
                />
                <div className="flex items-center gap-6 pt-6 pl-4">
                   <div className="flex items-center gap-3">
                      <input type="checkbox" name="palletExchange" id="palletExchange" defaultChecked={editingDelivery?.id ? editingDelivery.palletExchange : true} className="w-5 h-5 rounded border-border text-indigo-600 focus:ring-indigo-500" />
                      <label htmlFor="palletExchange" className="text-sm font-bold text-foreground">Palletruil Toepassen</label>
                   </div>
                   <div className="flex items-center gap-3">
                      <input type="checkbox" name="requiresQA" id="requiresQA" defaultChecked={editingDelivery?.requiresQA} className="w-5 h-5 rounded border-border text-amber-600 focus:ring-amber-500" />
                      <label htmlFor="requiresQA" className="text-sm font-bold text-foreground flex items-center gap-2">
                        QA Inspectie benodigd
                        <AlertCircle size={14} className="text-amber-500" />
                      </label>
                   </div>
                </div>
             </div>

             {/* Document Checklist */}
             <div className="border-t border-border pt-6 mt-6">
                <h4 className="text-sm font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-4">Documenten Checklist</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {(editingDelivery?.documents || []).map((doc: any, idx: number) => (
                     <div key={doc.id} className="flex items-center justify-between p-3 bg-[var(--muted)]/50 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3">
                           <input 
                             type="checkbox" 
                             checked={doc.status === 'received'} 
                             onChange={() => {
                               const newDocs = [...editingDelivery.documents];
                               const wasReceived = newDocs[idx].status === 'received';
                               newDocs[idx] = { ...newDocs[idx], status: wasReceived ? 'pending' : 'received' };
                               
                               // Milestone Reset Logic (v3.10.x): 
                               // If a required document is removed, downgrade the milestone to prevent invalid completion.
                               let currentStatus = editingDelivery.status;
                               if (wasReceived && doc.required) {
                                  if (currentStatus === 100) currentStatus = 75;
                                  else if (currentStatus >= 75) currentStatus = 50;
                                  else if (currentStatus >= 50) currentStatus = 25;
                               }
                               
                               setEditingDelivery({ ...editingDelivery, documents: newDocs, status: currentStatus });
                             }}
                             className="w-5 h-5 rounded border-border text-emerald-600 focus:ring-emerald-500"
                           />
                           <span className={cn("text-sm font-bold", doc.required ? "text-foreground" : "text-[var(--muted-foreground)]")}>
                             {doc.name} {doc.required && <span className="text-rose-500">*</span>}
                           </span>
                        </div>
                        <Badge variant={doc.status === 'received' ? 'success' : 'warning'} size="xs">
                           {doc.status === 'received' ? 'Gereed' : 'Wachtend'}
                        </Badge>
                     </div>
                   ))}
                   {(editingDelivery?.documents || []).length === 0 && !editingDelivery && (
                     <p className="text-xs text-[var(--muted-foreground)] italic col-span-2">Documenten worden automatisch toegevoegd bij het aanmaken op basis van type.</p>
                   )}
                </div>
             </div>

            <div className="flex gap-4 pt-6 border-t border-border">
               <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Annuleren</Button>
               <Button type="submit" className="flex-1">Opslaan</Button>
            </div>
         </form>
      </Modal>

      <TransportMailModal 
        isOpen={!!mailDelivery}
        onClose={() => setMailDelivery(null)}
        delivery={mailDelivery}
        transporter={state.addressBook?.transporters.find((t: any) => t.id === mailDelivery?.transporterId)}
        supplier={state.addressBook?.suppliers.find((s: any) => s.id === mailDelivery?.supplierId)}
      />
    </div>
  );
};

export default DeliveryManager;
