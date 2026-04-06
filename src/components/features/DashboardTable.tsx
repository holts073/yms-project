import React from 'react';
import { Package, Truck, MessageSquare, FileText, Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Table } from '../shared/Table';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { Delivery } from '../../types';
import { cn } from '../../lib/utils';

interface DashboardTableProps {
  deliveries: Delivery[];
  suppliers: any[];
  onSelect: (id: string) => void;
  onYmsRegister: (delivery: Delivery) => void;
  onMailTransport: (delivery: Delivery) => void;
  onUpdateStatus: (delivery: Delivery, status: number) => void;
  canEdit: boolean;
  borderless?: boolean;
}

export const DashboardTable: React.FC<DashboardTableProps> = ({
  deliveries,
  suppliers,
  onSelect,
  onYmsRegister,
  onMailTransport,
  onUpdateStatus,
  canEdit,
  borderless = false
}) => {
  const columns = [
    {
      header: 'Referentie',
      accessor: (d: Delivery) => {
        const s = suppliers.find(sup => sup.id === d.supplierId);
        return (
          <div className="flex items-center gap-3">
             <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                d.type === 'container' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "bg-orange-50 dark:bg-orange-900/30 text-orange-600"
             )}>
                {d.type === 'container' ? <Package size={16} /> : <Truck size={16} />}
             </div>
             <div>
                <p className="font-bold text-foreground">{d.reference}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-medium">
                  {d.type} • {s?.name || 'Onbekend'}
                </p>
             </div>
          </div>
        );
      }
    },
    {
      header: 'Indicaties',
      accessor: (d: Delivery) => (
        <div className="flex flex-col gap-1">
          {d.documents.some(doc => doc.required && doc.status === 'missing') && (
            <Badge variant="warning" size="xs" leftIcon={<FileText size={10} />}>Docs</Badge>
          )}
          {d.notes && (
            <div className="relative group/note inline-block">
              <MessageSquare size={14} className="text-indigo-500 opacity-50 hover:opacity-100 transition-opacity cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded-lg shadow-xl border border-border hidden group-hover/note:block z-50 leading-tight animate-in fade-in slide-in-from-bottom-1">
                 <p className="font-bold mb-1 uppercase tracking-tighter text-[9px] text-[var(--muted-foreground)] border-b border-border pb-1 mb-1">Opmerking:</p>
                 {d.notes}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (d: Delivery) => {
        const steps = d.type === 'container' 
          ? ['Besteld', 'Transit', 'Douane', 'Route', 'OK'] 
          : ['Besteld', 'Aanvraag', 'Route', 'OK'];
        const currentIdx = d.status === 100 ? steps.length - 1 : (d.status >= 75 ? steps.length - 2 : (d.status >= 50 ? steps.length - 3 : (d.status >= 25 ? 1 : 0)));
        
        return (
          <div className="flex flex-col gap-1.5 min-w-[120px]">
             <span className="text-[10px] font-black uppercase text-[var(--muted-foreground)]">{steps[currentIdx]}</span>
             <div className="flex gap-1">
                {steps.map((_, i) => (
                   <div key={i} className={cn("h-1 flex-1 rounded-full", i <= currentIdx ? "bg-indigo-600" : "bg-[var(--muted)]")} />
                ))}
             </div>
          </div>
        );
      }
    },
    {
      header: 'ETA',
      accessor: (d: Delivery) => (
        <span className="text-sm font-bold text-[var(--muted-foreground)]">
          {d.etaWarehouse ? new Date(d.etaWarehouse).toLocaleDateString('nl-NL') : '-'}
        </span>
      )
    },
    {
      header: 'Actie',
      accessor: (d: Delivery) => (
        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
           {d.type === 'exworks' && d.status < 25 && canEdit && (
             <Button size="xs" variant="secondary" onClick={() => onUpdateStatus(d, 25)}>Aanvraag</Button>
           )}
           {d.type === 'exworks' && d.status >= 25 && d.status < 50 && canEdit && (
             <Button size="xs" variant="secondary" leftIcon={<FileText size={12} />} onClick={() => onMailTransport(d)}>Order</Button>
           )}
           {d.status >= 50 && d.status < 75 && (
             <Button size="xs" variant="secondary" onClick={() => onUpdateStatus(d, 75)}>Aankomst</Button>
           )}
           {d.status === 75 && (
             <Button size="xs" leftIcon={<MapPin size={12} />} onClick={() => onYmsRegister(d)}>Gate-In</Button>
           )}
           <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"><ChevronRight size={18} /></button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return <Table data={deliveries} columns={columns} onRowClick={(d) => onSelect(d.id)} borderless={borderless} />;
};
