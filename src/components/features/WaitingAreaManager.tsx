import React from 'react';
import { ParkingSquare } from 'lucide-react';
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
  const filtered = waitingAreas.filter(wa => wa.warehouseId === warehouseId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {filtered.map((wa) => (
        <Card key={wa.id} className="hover:shadow-lg transition-all group border-2 hover:border-indigo-500/20">
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
                className="text-xs text-indigo-600 dark:text-indigo-400 p-0 hover:bg-transparent"
                onClick={() => onUpdate({ ...wa, status: wa.status === 'Blocked' ? 'Available' : 'Blocked' })}
               >
                 {wa.status === 'Blocked' ? 'Deblokkeren' : 'Blokkeren'}
               </Button>
            </div>
        </Card>
      ))}
    </div>
  );
};
