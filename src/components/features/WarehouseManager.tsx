import React from 'react';
import { Warehouse, Plus, Settings, Trash2, MapPin } from 'lucide-react';
import { Table } from '../shared/Table';
import { Button } from '../shared/Button';
import { YmsWarehouse } from '../../types';

interface WarehouseManagerProps {
  warehouses: YmsWarehouse[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit: (w: Partial<YmsWarehouse>) => void;
  onDelete: (id: string) => void;
  dockCount: (id: string) => number;
}

export const WarehouseManager: React.FC<WarehouseManagerProps> = ({
  warehouses,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  dockCount
}) => {
  const columns = [
    {
      header: 'Magazijn',
      accessor: (w: YmsWarehouse) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${selectedId === w.id ? 'bg-indigo-600 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
            <Warehouse size={18} />
          </div>
          <div>
            <p className="font-bold text-foreground">{w.name}</p>
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{w.id}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Locatie',
      accessor: (w: YmsWarehouse) => (
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <MapPin size={14} className="opacity-50" />
          {w.address || 'Geen adres'}
        </div>
      )
    },
    {
      header: 'Docks',
      accessor: (w: YmsWarehouse) => (
        <span className="px-2.5 py-1 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-lg text-xs font-black border border-border">
          {dockCount(w.id)}
        </span>
      ),
      className: 'text-center'
    },
    {
      header: 'Acties',
      accessor: (w: YmsWarehouse) => (
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant={selectedId === w.id ? 'primary' : 'secondary'} 
            size="sm" 
            onClick={() => onSelect(w.id)}
          >
            {selectedId === w.id ? 'Actief' : 'Selecteer'}
          </Button>
          <button onClick={() => onEdit(w)} className="p-2 text-[var(--muted-foreground)] hover:text-amber-600 transition-colors"><Settings size={18} /></button>
          {w.id !== 'W01' && (
            <button onClick={() => onDelete(w.id)} className="p-2 text-[var(--muted-foreground)] hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
          )}
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Magazijnbeheer</h3>
        <Button leftIcon={<Plus size={20} />} onClick={() => onEdit({})}>Magazijn Toevoegen</Button>
      </div>
      <Table data={warehouses} columns={columns} />
    </div>
  );
};
