import React from 'react';
import { Package, Truck, FileText, MapPin, Edit2, Trash2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Delivery } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { MilestoneStepper } from '../ui/MilestoneStepper';
import { isRegisteredOnTime } from '../../lib/logistics';

interface DeliveryTableProps {
  deliveries: Delivery[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenModal: (d: Delivery) => void;
  onDelete: (id: string) => void;
  onMailTransport: (d: Delivery) => void;
  onYmsRegister: (d: Delivery) => void;
  onUpdateStatus: (d: Delivery, s: number) => void;
  canEdit: boolean;
  suppliers: any[];
}

export const DeliveryTable: React.FC<DeliveryTableProps> = ({
  deliveries,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenModal,
  onDelete,
  onMailTransport,
  onYmsRegister,
  onUpdateStatus,
  canEdit,
  suppliers
}) => {
  if (deliveries.length === 0) {
    return <div className="p-8 text-center text-[var(--muted-foreground)] font-medium">Geen leveringen gevonden in de pipeline.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-[var(--muted)]/30">
      {deliveries.map(d => {
        const s = suppliers.find(sup => sup.id === d.supplierId);
        const steps = d.type === 'container' ? 5 : 4;
        const currentIdx = d.status === 100 ? steps - 1 : (d.status >= 75 ? steps - 2 : (d.status >= 50 ? steps - 3 : (d.status >= 25 ? 1 : 0)));
        const missingDocs = d.documents.filter(doc => doc.required && doc.status === 'missing').length;

        return (
          <div 
            key={d.id} 
            className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col gap-6 cursor-pointer group"
            onClick={() => onOpenModal(d)}
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                 <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                    d.type === 'container' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "bg-orange-50 dark:bg-orange-900/30 text-orange-600"
                 )}>
                    {d.type === 'container' ? <Package size={28} /> : <Truck size={28} />}
                 </div>
                 <div>
                    <div className="flex items-center gap-2">
                       <h3 className="text-xl font-black text-foreground group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{d.reference}</h3>
                       {isRegisteredOnTime(d) ? (
                         <div title="Tijdig aangemeld (>24u)" className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-1 rounded-full"><Clock size={12} /></div>
                       ) : (
                         <div title="Te laat aangemeld (<24u)" className="text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-1 rounded-full animate-pulse"><Clock size={12} /></div>
                       )}
                    </div>
                    <p className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{d.containerNumber || (d as any).licensePlate || 'GEEN NR'}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] line-clamp-1 mt-1">{s?.name || 'Onbekend Leverancier'}</p>
                 </div>
              </div>
              <div onClick={e => e.stopPropagation()}>
                 <input 
                   type="checkbox" 
                   checked={selectedIds.includes(d.id)} 
                   onChange={() => onToggleSelect(d.id)}
                   className="w-5 h-5 rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                 />
              </div>
            </div>

            {/* Body Info Box */}
            <div className="space-y-4 flex-1 bg-[var(--muted)]/30 rounded-2xl p-6 border border-border/50">
              {d.type === 'container' ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--muted-foreground)] font-semibold">ETA Port</span>
                    <span className="font-bold text-foreground">{d.etaPort ? new Date(d.etaPort).toLocaleDateString('nl-NL') : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--muted-foreground)] font-semibold">Douane</span>
                    <Badge variant={d.customsStatus === 'Cleared' ? 'success' : d.customsStatus === 'Inspection' ? 'destructive' : 'warning'} size="xs">
                       {d.customsStatus || 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--muted-foreground)] font-semibold">Terminal</span>
                    <span className="font-bold text-foreground line-clamp-1 text-right max-w-[120px]">{d.dischargeTerminal || '-'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--muted-foreground)] font-semibold">Ready for Pickup</span>
                    <span className="font-bold text-foreground">{d.readyForPickupDate ? new Date(d.readyForPickupDate).toLocaleDateString('nl-NL') : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--muted-foreground)] font-semibold">Incoterm</span>
                    <span className="font-black bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-md text-xs">{d.incoterm || 'EXW'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--muted-foreground)] font-semibold">Pallets</span>
                    <span className="font-bold text-foreground">{d.palletCount || '-'} {d.palletType}</span>
                  </div>
                </>
              )}
              
              <div className="pt-3">
                 <MilestoneStepper delivery={d} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
               <div>
                  {missingDocs > 0 ? (
                    <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                       <AlertTriangle size={14} /> {missingDocs} doc(s) missen
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                       <CheckCircle2 size={14} /> Compleet
                    </div>
                  )}
               </div>
               
               <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {d.type === 'exworks' && d.status >= 25 && d.status < 50 && canEdit && (
                    <button onClick={() => onMailTransport(d)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all" title="Mail Transporteur"><FileText size={18} /></button>
                  )}
                  {d.status >= 50 && d.status < 100 && (
                    <Button size="xs" leftIcon={<MapPin size={12} />} onClick={() => onYmsRegister(d)}>YMS</Button>
                  )}
                  {canEdit && <button onClick={() => confirm('Verwijderen?') && onDelete(d.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-all" title="Verwijderen"><Trash2 size={18} /></button>}
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
