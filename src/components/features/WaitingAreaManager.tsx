import React from 'react';
import { ParkingSquare, Plus, Trash2 } from 'lucide-react';
import { useYmsData } from '../../hooks/useYmsData';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { YmsWaitingArea } from '../../types';
import { cn } from '../../lib/utils';

interface WaitingAreaManagerProps {
  waitingAreas: YmsWaitingArea[];
  warehouseId: string;
  onUpdate: (wa: YmsWaitingArea) => void;
}

export const WaitingAreaManager: React.FC<WaitingAreaManagerProps> = ({ waitingAreas, warehouseId, onUpdate }) => {
  const { actions } = useYmsData();
  const filtered = waitingAreas
    .filter(wa => wa.warehouseId === warehouseId)
    .sort((a, b) => a.id - b.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">Wachtruimtes Configureren ({warehouseId})</h3>
        <Button variant="outline" size="xs" leftIcon={<Plus size={12} />} onClick={() => onUpdate({
          id: waitingAreas.length + 1,
          warehouseId,
          name: `Wachtplaats ${waitingAreas.length + 1}`,
          status: 'Available',
          adminStatus: 'Active'
        })}>
          Toevoegen
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((wa) => (
          <Card key={wa.id} data-testid={`wa-card-${wa.id}`} className="hover:shadow-lg transition-all group border-2 hover:border-indigo-500/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <ParkingSquare size={24} />
            </div>
            <Badge variant={wa.status === 'Available' ? 'success' : wa.status === 'Occupied' ? 'warning' : 'danger'}>
              {wa.status === 'Available' ? 'Vrij' : wa.status === 'Occupied' ? 'Bezet' : 'Blok'}
            </Badge>
          </div>
          <h4 className="text-lg font-black text-foreground mb-4">{wa.name}</h4>
          
          <div className="flex justify-between items-center pt-6 border-t border-border">
                <Button 
                 variant="ghost" 
                 size="sm" 
                 data-testid={`block-wa-${wa.id}`}
                 className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline p-0"
                 onClick={() => onUpdate({ ...wa, status: wa.status === 'Blocked' ? 'Available' : 'Blocked' })}
                >
                  {wa.status === 'Blocked' ? 'Deblokkeren' : 'Blokkeren'}
                </Button>
                <button
                  data-testid={`delete-wa-${wa.id}`}
                  onClick={() => confirm(`Weet je zeker dat je ${wa.name} wilt verwijderen?`) && actions.deleteWaitingArea(wa.id, warehouseId)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
             </div>
        </Card>
      ))}
      </div>
    </div>
  );
};
