import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, CheckCircle2, AlertTriangle, MoreVertical, Edit2, LayoutGrid, Warehouse, Truck, Anchor, Zap, AlertCircle, Warehouse as WarehouseIcon } from 'lucide-react';
import { useYmsData } from '../../hooks/useYmsData';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { YmsDelivery, YmsDock, YmsWaitingArea, YmsDeliveryStatus } from '../../types';
import { cn } from '../../lib/utils';
import { isFastLaneEligible } from '../../lib/ymsRules';

interface YmsDeliveryListProps {
  deliveries: YmsDelivery[];
  getStatusLabel: (status: any) => string;
  onUpdateStatus: (id: string, status: any) => void;
  onAssignDock: (delivery: YmsDelivery, dockId: string) => void;
  onAssignWaitingArea: (delivery: YmsDelivery, waId: string) => void;
  onRegisterExpected: (delivery: YmsDelivery) => void;
  onEdit: (delivery: YmsDelivery) => void;
}

export const YmsDeliveryList: React.FC<YmsDeliveryListProps> = ({
  deliveries,
  getStatusLabel,
  onUpdateStatus,
  onAssignDock,
  onAssignWaitingArea,
  onRegisterExpected,
  onEdit
}) => {
  const { docks, waitingAreas } = useYmsData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const statuses: YmsDeliveryStatus[] = ['EXPECTED', 'PLANNED', 'GATE_IN', 'IN_YARD', 'DOCKED', 'UNLOADING', 'LOADING'];

  const calculateWaitTime = (time?: string) => {
    if (!time) return '-';
    const diff = new Date().getTime() - new Date(time).getTime();
    if (diff < 0) return 'Te Vroeg';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}u ${mins % 60}m`;
  };

  return (
    <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
      <div className="flex gap-4 mb-2 overflow-x-auto pb-2 scrollbar-hide">
        {statuses.map(s => {
          const count = deliveries.filter(d => d.status === s).length;
          if (count === 0) return null;
          return (
            <Badge key={s} variant="outline" className="whitespace-nowrap font-bold">
              {getStatusLabel(s)} ({count})
            </Badge>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {deliveries.filter(d => statuses.includes(d.status)).map(delivery => {
           const dockName = delivery.dockId ? docks.find(d => d.id === delivery.dockId)?.name : null;
           const waName = delivery.waitingAreaId ? waitingAreas.find(w => w.id.toString() === delivery.waitingAreaId?.toString())?.name : null;
           
           return (
            <motion.div 
              layout 
              key={delivery.id} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 hover:shadow-2xl hover:-translate-y-1 dark:hover:shadow-indigo-500/10 transition-all group flex flex-col justify-between gap-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                   <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                      delivery.status === 'EXPECTED' ? "bg-purple-50 dark:bg-purple-900/10 text-purple-600" :
                      delivery.status === 'GATE_IN' ? "bg-amber-50 dark:bg-amber-900/10 text-amber-600" :
                      delivery.status === 'DOCKED' ? "bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600" :
                      "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600"
                   )}>
                      <Truck size={24} />
                   </div>
                   <div>
                     <h4 className="text-xl font-black text-foreground group-hover:text-indigo-600 transition-colors">{delivery.reference}</h4>
                     <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] line-clamp-1">{delivery.supplier}</p>
                   </div>
                </div>
                <Badge variant={
                    delivery.status === 'EXPECTED' ? 'secondary' : 
                    delivery.status === 'GATE_IN' ? 'warning' : 'success'
                }>
                   {getStatusLabel(delivery.status)}
                </Badge>
              </div>

              {/* Body */}
              <div className="bg-[var(--muted)]/40 rounded-2xl p-6 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[var(--muted-foreground)] font-semibold flex items-center gap-1.5"><Clock size={14}/> Wachttijd</span>
                   <span className={cn(
                     "font-bold px-2 py-0.5 rounded-md",
                     delivery.status !== 'EXPECTED' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-transparent text-foreground"
                   )}>
                     {delivery.status !== 'EXPECTED' ? calculateWaitTime(delivery.registrationTime || delivery.scheduledTime) : '-'}
                   </span>
                 </div>
                 
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[var(--muted-foreground)] font-semibold flex items-center gap-1.5"><Anchor size={14}/> Locatie</span>
                   <span className="font-bold text-foreground">
                      {dockName ? dockName : (waName ? waName : 'Nog niet toegewezen')}
                   </span>
                 </div>
                 
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[var(--muted-foreground)] font-semibold">Tijdschema</span>
                   <span className="font-bold text-foreground">{new Date(delivery.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
                 
                 <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                    <span className="text-[var(--muted-foreground)] font-semibold">Pallets & Lading</span>
                    <span className="font-bold text-foreground">{delivery.palletCount || 0} Pallets</span>
                 </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                 <div className="flex gap-2 flex-wrap">
                    <Badge variant={delivery.direction === 'OUTBOUND' ? 'warning' : 'info'} size="xs">
                       {delivery.direction === 'OUTBOUND' ? 'OUT' : 'IN'}
                    </Badge>
                    {(delivery.temperature === 'Vries' || delivery.temperature === 'Koel') && (
                      <Badge variant="info" size="xs">{delivery.temperature}</Badge>
                    )}
                    {delivery.isReefer && <Badge variant="danger" size="xs">Reefer</Badge>}
                    {isFastLaneEligible(delivery) && <Badge variant="warning" size="xs"><Zap size={10} className="mr-1" /> Fast Lane</Badge>}
                 </div>
                 
                 <div className="flex gap-2">
                   {delivery.status === 'EXPECTED' && (
                     <Button size="xs" onClick={() => onRegisterExpected(delivery)} className="bg-purple-600 hover:bg-purple-700 shadow-purple-100">
                       Aanmelden
                     </Button>
                   )}
                   {(delivery.status === 'GATE_IN' || delivery.status === 'PLANNED') && (
                     <Button size="xs" variant="outline" leftIcon={<WarehouseIcon size={14} />}>
                       Toewijzen
                     </Button>
                   )}
                   {delivery.status === 'DOCKED' && (
                     <Button size="xs" variant="outline" onClick={() => onUpdateStatus(delivery, 'UNLOADING')}>Lossen</Button>
                   )}
                   {(delivery.status === 'UNLOADING' || delivery.status === 'LOADING') && (
                     <Button size="xs" leftIcon={<CheckCircle2 size={14} />} onClick={() => onUpdateStatus(delivery, 'COMPLETED')}>Gereed</Button>
                   )}
                   <button onClick={() => onEdit(delivery)} className="p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-full transition-colors">
                     <MoreVertical size={16} />
                   </button>
                 </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
