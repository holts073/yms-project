import React from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { MapPin, Zap } from 'lucide-react';
import { YmsDock, YmsWaitingArea, YmsDelivery } from '../../types';

interface YmsAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: YmsDelivery | null;
  docks: YmsDock[];
  waitingAreas: YmsWaitingArea[];
  onAssignDock: (dockId: number) => void;
  onAssignWaitingArea: (waId: number) => void;
}

export const YmsAssignmentModal: React.FC<YmsAssignmentModalProps> = ({
  isOpen,
  onClose,
  delivery,
  docks,
  waitingAreas,
  onAssignDock,
  onAssignWaitingArea
}) => {
  if (!delivery) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Toewijzen aan Dock of Wachtruimte"
      maxWidth="lg"
    >
      <div className="space-y-8 pb-4">
        <div className="bg-[var(--muted)]/50 p-6 rounded-3xl border border-border">
          <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Geselecteerde Levering</p>
          <div className="flex justify-between items-center">
            <h4 className="text-xl font-bold text-foreground">{delivery.supplier}</h4>
            <Badge variant="info">{delivery.reference}</Badge>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">Temperatuur: {delivery.temperature} | Pallets: {delivery.palletCount}</p>
        </div>

        <div className="space-y-4">
          <h5 className="font-bold text-foreground flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" /> Beschikbare Docks
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {docks.filter(d => d.status === 'Available').map(dock => (
              <button
                key={dock.id}
                onClick={() => onAssignDock(dock.id)}
                className="flex flex-col items-start p-4 bg-card border border-border rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
              >
                <span className="font-bold text-foreground group-hover:text-indigo-600">{dock.name}</span>
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase">{dock.allowedTemperatures.join(', ')}</span>
              </button>
            ))}
            {docks.filter(d => d.status === 'Available').length === 0 && (
              <p className="col-span-2 text-sm text-[var(--muted-foreground)] italic p-4 text-center">Geen docks beschikbaar</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="font-bold text-foreground flex items-center gap-2">
            <Zap size={18} className="text-amber-600" /> Beschikbare Wachtruimtes
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {waitingAreas.filter(wa => wa.status === 'Available' && wa.adminStatus !== 'Blocked' && wa.adminStatus !== 'Deactivated').map(wa => (
              <button
                key={wa.id}
                onClick={() => onAssignWaitingArea(parseInt(wa.id))}
                className="flex flex-col items-start p-4 bg-card border border-border rounded-2xl hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-left group"
              >
                <span className="font-bold text-foreground group-hover:text-amber-600">Place {wa.name}</span>
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase">Parking</span>
              </button>
            ))}
            {waitingAreas.filter(wa => wa.status === 'Available').length === 0 && (
              <p className="col-span-2 text-sm text-[var(--muted-foreground)] italic p-4 text-center">Geen wachtruimtes beschikbaar</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
