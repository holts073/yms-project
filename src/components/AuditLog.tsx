import React, { useState, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { History, User as UserIcon, Calendar, Search, ArrowRight, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { Table } from './shared/Table';
import { Badge } from './shared/Badge';

const AuditLog = ({ onNavigate }: { onNavigate?: (tab: string, reference?: string) => void }) => {
  const { state } = useSocket();
  const { logs, isLoading } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchStr = `${log.timestamp} ${log.user} ${log.action} ${log.details} ${log.reference || ''} ${log.warehouseId || ''}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [logs, searchTerm]);

  const columns = [
    {
      header: 'Tijdstip',
      accessor: (log: any) => (
        <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
          <Calendar size={16} />
          <span className="text-sm font-medium">
            {format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm', { locale: nl })}
          </span>
        </div>
      )
    },
    {
      header: 'Gebruiker',
      accessor: (log: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
            <UserIcon size={14} />
          </div>
          <span className="text-sm font-bold text-foreground">{log.user}</span>
        </div>
      )
    },
    {
      header: 'Actie',
      accessor: (log: any) => (
        <Badge 
          variant={
            log.action.includes('Created') || log.action.includes('Added') ? 'success' :
            log.action.includes('Deleted') ? 'danger' : 'info'
          }
          size="xs"
        >
          {log.action}
        </Badge>
      )
    },
    {
      header: 'Magazijn',
      accessor: (log: any) => log.warehouseId ? (
        <Badge variant="outline" size="xs" className="font-mono tracking-tighter">
          {log.warehouseId}
        </Badge>
      ) : <span className="text-xs text-[var(--muted-foreground)] italic lowercase">Systeem</span>
    },
    {
      header: 'Referentie',
      accessor: (log: any) => log.reference ? (
        <div className="flex flex-col text-left">
          <button 
            onClick={() => onNavigate?.('deliveries', log.reference)}
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-all text-left"
          >
            {log.reference}
          </button>
          {(() => {
             const delivery = state?.deliveries?.find((d: any) => d.reference === log.reference);
             const supplier = state?.addressBook?.suppliers?.find((s: any) => s.id === delivery?.supplierId);
             if (supplier?.otif) {
               return <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">OTIF: {supplier.otif}%</span>;
             }
             return null;
          })()}
        </div>
      ) : <span className="text-sm text-[var(--muted-foreground)]">-</span>
    },
    {
      header: 'Details',
      accessor: (log: any) => (
        <div className="flex items-center gap-3 text-[var(--muted-foreground)] w-full">
          <span className="text-sm font-medium truncate max-w-xs">{log.details}</span>
          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <FileText className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight italic uppercase">Audit Log</h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium tracking-widest uppercase text-xs">Overzicht van alle wijzigingen en acties in het systeem.</p>
          </div>
        </div>
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
          <input 
            type="text" 
            placeholder="Zoek op tijd, gebruiker, actie, ref..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm text-foreground outline-none"
          />
        </div>
      </header>

      <Table 
        data={filteredLogs}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Geen logs gevonden die voldoen aan de zoekterm."
        emptyIcon={<History size={48} />}
      />
    </div>
  );
};

export default AuditLog;
