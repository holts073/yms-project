import React from 'react';
import { MapPin, Thermometer, Plus, Trash2 } from 'lucide-react';
import { useYmsData } from '../../hooks/useYmsData';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { YmsDock, YmsTemperature } from '../../types';
import { cn } from '../../lib/utils';

interface DockManagerProps {
  docks: YmsDock[];
  warehouseId: string;
  onUpdate: (dock: YmsDock) => void;
}

export const DockManager: React.FC<DockManagerProps> = ({ docks, warehouseId, onUpdate }) => {
  const { actions } = useYmsData();
  const filteredDocks = docks
    .filter(d => d.warehouseId === warehouseId)
    .sort((a, b) => a.id - b.id);

  const toggleTemp = (dock: YmsDock, temp: YmsTemperature) => {
    const newTemps = dock.allowedTemperatures.includes(temp)
      ? dock.allowedTemperatures.filter(t => t !== temp)
      : [...dock.allowedTemperatures, temp];
    onUpdate({ ...dock, allowedTemperatures: newTemps });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">Docks Configureren ({warehouseId})</h3>
        <Button variant="outline" size="xs" leftIcon={<Plus size={12} />} onClick={() => onUpdate({
          id: filteredDocks.length + 1,
          warehouseId: warehouseId,
          name: `Nieuw Dock ${filteredDocks.length + 1}`,
          allowedTemperatures: ['Droog'],
          status: 'Available',
          adminStatus: 'Active',
          direction_capability: 'BOTH'
        } as YmsDock)}>
          Dock Toevoegen
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredDocks.map(dock => (
          <Card key={dock.id} data-testid={`dock-card-${dock.id}`} padding="lg" className="hover:shadow-lg transition-all group border-2 hover:border-indigo-500/20">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <MapPin size={24} />
            </div>
            <Badge variant={dock.status === 'Available' ? 'success' : dock.status === 'Occupied' ? 'warning' : 'danger'}>
              {dock.status === 'Available' ? 'Vrij' : dock.status === 'Occupied' ? 'Bezet' : 'Blok'}
            </Badge>
          </div>
          <input
            type="text"
            value={dock.name}
            onChange={e => onUpdate({ ...dock, name: e.target.value })}
            className="text-lg font-black text-foreground bg-transparent border-none p-0 focus:ring-0 mb-4 w-full"
          />
          <div className="space-y-4">
             <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">Temperaturen</p>
             <div className="flex flex-wrap gap-1.5">
               {(['Droog', 'Koel', 'Vries'] as YmsTemperature[]).map(t => (
                 <button
                   key={t}
                   onClick={() => toggleTemp(dock, t)}
                   className={cn(
                     "px-2 py-1 rounded-lg text-[10px] font-bold transition-all border",
                     dock.allowedTemperatures.includes(t) 
                      ? "bg-indigo-600 text-white border-indigo-600" 
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] border-border hover:border-indigo-500/50"
                   )}
                 >
                   {t}
                 </button>
               ))}
             </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
             <div className="flex gap-1 p-1 bg-[var(--muted)] rounded-xl border border-border">
                {(['INBOUND', 'OUTBOUND', 'BOTH'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => onUpdate({ ...dock, direction_capability: dir })}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[8px] font-black transition-all",
                      dock.direction_capability === dir 
                        ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm" 
                        : "text-[var(--muted-foreground)] hover:text-foreground"
                    )}
                  >
                    {dir}
                  </button>
                ))}
             </div>
             <button
               onClick={() => onUpdate({ ...dock, isFastLane: !dock.isFastLane })}
               className={cn(
                 "py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                 dock.isFastLane ? "bg-amber-500/10 border-amber-500/50 text-amber-600" : "bg-[var(--muted)] border-transparent text-[var(--muted-foreground)]"
               )}
             >
               {dock.isFastLane ? 'FAST LANE: AAN' : 'STANDAARD DOCK'}
             </button>
             <div className="flex items-baseline justify-between mt-2">
                <button
                   data-testid={`block-dock-${dock.id}`}
                   onClick={() => onUpdate({ ...dock, status: dock.status === 'Blocked' ? 'Available' : 'Blocked' })}
                   className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline"
                >
                   {dock.status === 'Blocked' ? 'Deblokkeren' : 'Blokkeren'}
                </button>
                <button
                  data-testid={`delete-dock-${dock.id}`}
                  onClick={() => confirm(`Weet je zeker dat je ${dock.name} wilt verwijderen?`) && actions.deleteDock(dock.id, warehouseId)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
             </div>
          </div>
        </Card>
      ))}
      </div>
    </div>
  );
};
