import React from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { useYmsData } from '../../hooks/useYmsData';
import { YmsWaitingArea } from '../../types';
import { cn } from '../../lib/utils';

export const YmsWaitingAreaGrid: React.FC = () => {
  const { waitingAreas, actions } = useYmsData();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {waitingAreas.map((wa) => (
        <Card key={wa.id} padding="sm" className={cn(
          "hover:shadow-md transition-all group",
          wa.adminStatus === 'Blocked' && 'grayscale opacity-70'
        )}>
          <div className="flex justify-between items-start mb-2">
            <div className={cn(
              "p-2 rounded-xl",
              wa.status === 'Available' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            )}>
              <Zap size={16} />
            </div>
            <Badge size="xs" variant={wa.adminStatus === 'Blocked' ? 'danger' : wa.adminStatus === 'Deactivated' ? 'default' : 'success'}>
              {wa.adminStatus || 'Actief'}
            </Badge>
          </div>
          
          <h5 className="font-bold text-foreground text-sm">Plaats {wa.name}</h5>
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase font-medium mt-1">
            {wa.status === 'Available' ? 'Vrij' : 'Bezet'}
          </p>
          
          <div className="mt-3 pt-3 border-t border-border flex gap-2">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                title="Blokkeren/Deblokkeren"
                onClick={() => actions.updateWaitingArea({ ...wa, adminStatus: wa.adminStatus === 'Blocked' ? 'Active' : 'Blocked' })}
             >
                <AlertCircle size={12} />
             </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
