import React from 'react';
import { Zap, AlertCircle, Trash2, Lock, Unlock } from 'lucide-react';
import { useSocket } from '../../SocketContext';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { Table } from '../shared/Table';
import { useYmsData } from '../../hooks/useYmsData';
import { YmsWaitingArea } from '../../types';
import { cn } from '../../lib/utils';

export const YmsWaitingAreaGrid: React.FC<{ data?: YmsWaitingArea[] }> = ({ data }) => {
  const { waitingAreas, actions } = useYmsData();
  const { currentUser } = useSocket();
  const isAdmin = currentUser?.role === 'admin';
  const displayData = data || waitingAreas;
  const sortedWaitingAreas = React.useMemo(() => [...displayData].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })), [displayData]);

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
