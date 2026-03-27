import React from 'react';
import { Zap, AlertCircle, Trash2, Lock, Unlock } from 'lucide-react';
import { useSocket } from '../../SocketContext';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { Table } from '../shared/Table';
import { useYmsData } from '../../hooks/useYmsData';
import { YmsWaitingArea } from '../../types';
import { cn } from '../../lib/utils';

export const YmsWaitingAreaGrid: React.FC = () => {
  const { waitingAreas, actions } = useYmsData();
  const { currentUser } = useSocket();
  const isAdmin = currentUser?.role === 'admin';
  const sortedWaitingAreas = React.useMemo(() => [...waitingAreas].sort((a, b) => a.name.localeCompare(b.name)), [waitingAreas]);

  const columns = [
    {
      header: 'Status',
      accessor: (wa: YmsWaitingArea) => (
        <Badge size="xs" variant={wa.adminStatus === 'Inactive' ? 'danger' : 'success'}>
          {wa.adminStatus || 'Actief'}
        </Badge>
      )
    },
    {
      header: 'Naam',
      accessor: (wa: YmsWaitingArea) => (
        <div className="flex items-center gap-2">
          <Zap size={14} className={wa.status === 'Available' ? "text-emerald-500" : "text-amber-500"} />
          <span className="font-bold text-foreground text-sm">Plaats {wa.name}</span>
        </div>
      )
    },
    {
      header: 'Bezetting',
      accessor: (wa: YmsWaitingArea) => (
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          wa.status === 'Available' ? "text-emerald-600" : "text-amber-600"
        )}>
          {wa.status === 'Available' ? 'Vrij' : 'Bezet'}
        </span>
      )
    },
    {
      header: 'Acties',
      className: 'text-right',
      accessor: (wa: YmsWaitingArea) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" 
            title="Blokkeren/Deblokkeren"
            onClick={() => actions.updateWaitingArea({ ...wa, adminStatus: wa.adminStatus === 'Inactive' ? 'Active' : 'Inactive' })}
          >
            {wa.adminStatus === 'Inactive' ? <Unlock size={14} /> : <Lock size={14} />}
          </Button>

          {isAdmin && (
            <button 
              onClick={() => {
                if (confirm(`Weet je zeker dat je wachtplaats ${wa.name} wilt verwijderen?`)) {
                  actions.deleteWaitingArea(wa.id, wa.warehouseId);
                }
              }}
              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
              title="Verwijderen"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <Table 
      data={sortedWaitingAreas} 
      columns={columns} 
      emptyMessage="Geen wachtplaatsen geconfigureerd."
      borderless
      rowClassName="bg-card/30"
    />
  );
};
