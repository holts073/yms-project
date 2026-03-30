import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  MoreVertical, 
  Edit2, 
  LayoutGrid, 
  Warehouse, 
  Truck, 
  Anchor, 
  Zap, 
  AlertCircle, 
  Warehouse as WarehouseIcon,
  Trash2,
  Play,
  ArrowRight,
  ClipboardCheck,
  Check
} from 'lucide-react';
import { useYmsData } from '../../hooks/useYmsData';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { Table } from '../shared/Table';
import { YmsDelivery, YmsDock, YmsWaitingArea, YmsDeliveryStatus } from '../../types';
import { cn } from '../../lib/utils';
import { isFastLaneEligible } from '../../lib/ymsRules';

interface YmsDeliveryListProps {
  deliveries: YmsDelivery[];
  getStatusLabel: (status: any) => string;
  onUpdateStatus: (delivery: YmsDelivery, status: any) => void;
  onAssignDock: (delivery: YmsDelivery, dockId: string) => void;
  onAssignWaitingArea: (delivery: YmsDelivery, waId: string) => void;
  onRegisterExpected: (delivery: YmsDelivery) => void;
  onEdit: (delivery: YmsDelivery) => void;
  onAssignClick?: (delivery: YmsDelivery) => void;
}

export const YmsDeliveryList: React.FC<YmsDeliveryListProps> = ({
  deliveries,
  getStatusLabel,
  onUpdateStatus,
  onAssignDock,
  onAssignWaitingArea,
  onRegisterExpected,
  onEdit,
  onAssignClick
}) => {
  const { docks, waitingAreas, actions } = useYmsData();
  const [filterStatus, setFilterStatus] = useState<YmsDeliveryStatus | 'ALL'>('ALL');

  const calculateWaitTime = (registrationTime?: string) => {
    if (!registrationTime) return '-';
    const start = new Date(registrationTime).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000);
    return `${diff}m`;
  };

  const statuses: YmsDeliveryStatus[] = ['EXPECTED', 'GATE_IN', 'IN_YARD', 'PLANNED', 'DOCKED', 'UNLOADING', 'LOADING', 'COMPLETED'];
  const filteredData = deliveries.filter(d => filterStatus === 'ALL' || d.status === filterStatus);

  const columns = [
    {
      header: 'Status',
      accessor: (d: YmsDelivery) => (
        <div className="flex flex-col gap-1">
          <Badge 
            data-testid="delivery-status-badge"
            variant={
              d.status === 'EXPECTED' ? 'info' : 
              d.status === 'GATE_IN' ? 'warning' : 
              d.status === 'COMPLETED' ? 'success' : 'default'
            } size="xs" className="w-fit">
            {getStatusLabel(d.status)}
          </Badge>
          <div className="flex gap-1 items-center">
            <Badge variant={d.direction === 'OUTBOUND' ? 'warning' : 'info'} className="text-[8px] px-1 h-3.5 leading-none">
               {d.direction || 'IN'}
            </Badge>
            {d.isReefer && <Zap size={10} className="text-blue-500 animate-pulse" />}
          </div>
        </div>
      )
    },
    {
      header: 'Referentie / Leverancier',
      accessor: (d: YmsDelivery) => (
        <div className="flex flex-col">
          <span data-testid="delivery-reference" className="font-black text-foreground text-sm tracking-tight">{d.reference}</span>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase truncate max-w-[150px]">{d.supplier}</span>
        </div>
      )
    },
    {
      header: 'Locatie',
      accessor: (d: YmsDelivery) => {
        const dock = d.dockId ? docks.find(dk => String(dk.id) === String(d.dockId))?.name : null;
        const wa = d.waitingAreaId ? waitingAreas.find(w => String(w.id) === String(d.waitingAreaId))?.name : null;
        return (
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            {dock ? <WarehouseIcon size={14} className="text-indigo-500" /> : (wa ? <Zap size={14} className="text-amber-500" /> : <MapPin size={14} className="text-slate-300" />)}
            <span>{dock || wa || 'Nieuw'}</span>
          </div>
        );
      }
    },
    {
      header: 'Tijd',
      accessor: (d: YmsDelivery) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-foreground">{new Date(d.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span className="text-[9px] text-[var(--muted-foreground)] font-bold">{calculateWaitTime(d.registrationTime || d.arrivalTime)}</span>
        </div>
      )
    },
    {
      header: 'Acties',
      className: 'text-right',
      accessor: (d: YmsDelivery) => (
        <div className="flex items-center justify-end gap-1.5">
          {d.status === 'EXPECTED' && (
            <Button data-testid="btn-register" size="xs" onClick={() => onRegisterExpected(d)} className="bg-purple-600 hover:bg-purple-700 h-7 px-3">
              Aanmelden
            </Button>
          )}
          {(d.status === 'GATE_IN' || d.status === 'PLANNED') && (
            <Button data-testid="btn-assign" size="xs" variant="outline" leftIcon={<WarehouseIcon size={12} />} onClick={() => onAssignClick?.(d)} className="h-7 px-3">
              Toewijzen
            </Button>
          )}
          {d.status === 'DOCKED' && (
            <Button data-testid="btn-unload" size="xs" variant="outline" leftIcon={<Play size={12} />} onClick={() => onUpdateStatus(d, 'UNLOADING')} className="h-7 px-3">
              Lossen
            </Button>
          )}
          {(d.status === 'UNLOADING' || d.status === 'LOADING') && (
            <div className="flex gap-1 items-center">
              {!d.isPalletExchangeConfirmed && (
                <Button 
                  size="xs" 
                  variant="outline" 
                  leftIcon={<ClipboardCheck size={12} />} 
                  onClick={() => {
                    const promptMsg = `Bevestig palletruil voor ${d.reference}:\n` +
                                     `Type: ${d.palletType || 'EUR'}\n` +
                                     `Tarief: €${d.palletRate?.toFixed(2) || '0.00'}\n` +
                                     `Aantal gepland: ${d.palletCount || 0}\n\n` +
                                     `Hoeveel pallets zijn er werkelijk geruild?`;
                    const count = prompt(promptMsg, String(d.palletsExchanged ?? d.palletCount ?? 0));
                    if (count !== null) {
                      onUpdateStatus({ 
                        ...d, 
                        palletsExchanged: parseInt(count) || 0, 
                        isPalletExchangeConfirmed: true 
                      }, d.status);
                    }
                  }} 
                  className="h-7 px-3 border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                >
                  Pallets
                </Button>
              )}
              {d.isPalletExchangeConfirmed && (
                <Badge variant="success" size="xs" className="h-7 px-2 flex items-center gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                  <Check size={10} /> {d.palletsExchanged} {d.palletType || 'Pallets'}
                </Badge>
              )}
              <Button data-testid="btn-complete" size="xs" leftIcon={<CheckCircle2 size={12} />} onClick={() => onUpdateStatus(d, 'COMPLETED')} className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">
                Gereed
              </Button>
            </div>
          )}
          {/* Missing status progression buttons */}
          {d.status === 'IN_YARD' && (
            <Button data-testid="btn-call" size="xs" variant="outline" leftIcon={<ArrowRight size={12} />} onClick={() => onUpdateStatus(d, 'GATE_IN')} className="h-7 px-3 border-amber-500 text-amber-600">
              Oproepen
            </Button>
          )}

          <div className="flex items-center ml-2 border-l border-border pl-2 gap-1">
            <button 
              onClick={() => onEdit(d)} 
              className="p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              title="Bewerken"
            >
              <Edit2 size={14} />
            </button>
            <button 
              onClick={() => {
                if(confirm('Weet je zeker dat je deze levering wilt verwijderen?')) {
                  actions.deleteDelivery(d.id);
                }
              }} 
              className="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 rounded-lg transition-colors"
              title="Verwijderen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
            filterStatus === 'ALL' ? "bg-indigo-600 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
          )}
        >
          Alles ({deliveries.length})
        </button>
        {statuses.map(s => {
          const count = deliveries.filter(d => d.status === s).length;
          if (count === 0 && filterStatus !== s) return null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filterStatus === s ? "bg-indigo-600 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
              )}
            >
              {getStatusLabel(s)} ({count})
            </button>
          );
        })}
      </div>

      <Table 
        data={filteredData} 
        columns={columns} 
        emptyMessage="Geen actieve leveringen gevonden."
        borderless
        rowClassName="bg-card/50"
      />
    </div>
  );
};
