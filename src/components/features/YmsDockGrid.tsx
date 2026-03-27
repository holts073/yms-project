import React from 'react';
import { MapPin, Thermometer, Trash2, Lock, Unlock } from 'lucide-react';
import { useSocket } from '../../SocketContext';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { Table } from '../shared/Table';
import { useYmsData } from '../../hooks/useYmsData';
import { YmsDock } from '../../types';
import { cn } from '../../lib/utils';

export const YmsDockGrid: React.FC = () => {
  const { docks, actions } = useYmsData();
  const { currentUser } = useSocket();
  const isAdmin = currentUser?.role === 'admin';
  const sortedDocks = React.useMemo(() => [...docks].sort((a, b) => a.name.localeCompare(b.name)), [docks]);
  
  const columns = [
    {
      header: 'Status',
      accessor: (dock: YmsDock) => (
        <Badge variant={
          dock.status === 'Available' ? 'success' :
          dock.status === 'Occupied' ? 'warning' : 'danger'
        } size="xs">
          {dock.status === 'Available' ? 'Vrij' : dock.status === 'Occupied' ? 'Bezet' : 'Blok'}
        </Badge>
      )
    },
    {
      header: 'Dock Naam',
      accessor: (dock: YmsDock) => (
        <div className="flex items-center gap-2">
          <MapPin size={14} className={cn(
            dock.status === 'Available' ? "text-emerald-500" :
            dock.status === 'Occupied' ? "text-amber-500" : "text-rose-500"
          )} />
          <span className="font-bold text-foreground">{dock.name}</span>
        </div>
      )
    },
    {
      header: 'Kenmerken',
      accessor: (dock: YmsDock) => (
        <div className="flex flex-wrap gap-1">
          {dock.allowedTemperatures.map((temp) => (
            <Badge key={temp} variant="outline" className="text-[9px] px-1 h-3.5 leading-none">
               {temp}
            </Badge>
          ))}
          {dock.isFastLane && <Badge variant="info" className="text-[9px] px-1 h-3.5 leading-none bg-blue-500/10 text-blue-600 border-none">FL</Badge>}
          {dock.isOutboundOnly && <Badge variant="info" className="text-[9px] px-1 h-3.5 leading-none bg-purple-500/10 text-purple-600 border-none">OUT</Badge>}
        </div>
      )
    },
    {
      header: 'Acties',
      className: 'text-right',
      accessor: (dock: YmsDock) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            onClick={() => actions.updateDock({ ...dock, status: dock.status === 'Blocked' ? 'Available' : 'Blocked' })}
            title={dock.status === 'Blocked' ? 'Vrijgeven' : 'Blokkeren'}
          >
            {dock.status === 'Blocked' ? <Unlock size={14} /> : <Lock size={14} />}
          </Button>

          {isAdmin && (
            <button 
              onClick={() => {
                if (confirm(`Weet je zeker dat je ${dock.name} wilt verwijderen?`)) {
                  actions.deleteDock(dock.id, dock.warehouseId);
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
      data={sortedDocks} 
      columns={columns} 
      emptyMessage="Geen docks geconfigureerd."
      borderless
      rowClassName="bg-card/30"
    />
  );
};
