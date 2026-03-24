import React from 'react';
import { MapPin, Thermometer } from 'lucide-react';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { YmsDock } from '../../types';
import { cn } from '../../lib/utils';

interface YmsDockGridProps {
  docks: YmsDock[];
  onUpdateDock: (dock: any) => void;
}

export const YmsDockGrid: React.FC<YmsDockGridProps> = ({ docks, onUpdateDock }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {docks.map((dock) => (
        <Card key={dock.id} className="hover:shadow-lg hover:shadow-indigo-500/5 group">
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "p-3 rounded-2xl transition-colors",
              dock.status === 'Available' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
              dock.status === 'Occupied' ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
              "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
            )}>
              <MapPin size={24} />
            </div>
            <Badge variant={
              dock.status === 'Available' ? 'success' :
              dock.status === 'Occupied' ? 'warning' : 'danger'
            }>
              {dock.status === 'Available' ? 'Vrij' : dock.status === 'Occupied' ? 'Bezet' : 'Blok'}
            </Badge>
          </div>

          <h4 className="text-lg font-bold text-foreground mb-4">{dock.name}</h4>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {dock.allowedTemperatures.map((temp) => (
                <Badge key={temp} variant="outline" size="xs" className="flex items-center gap-1">
                  <Thermometer size={10} /> {temp}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {dock.isFastLane && <Badge variant="info" size="xs">Fast Lane</Badge>}
              {dock.isOutboundOnly && <Badge variant="info" size="xs">Outbound Only</Badge>}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
             <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-indigo-600 dark:text-indigo-400 p-0 hover:bg-transparent"
                onClick={() => onUpdateDock({ ...dock, status: dock.status === 'Blocked' ? 'Available' : 'Blocked' })}
             >
                {dock.status === 'Blocked' ? 'Deblokkeren' : 'Blokkeren'}
             </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
