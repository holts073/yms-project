import React from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { MapPin, Zap } from 'lucide-react';
import { YmsDock, YmsWaitingArea, YmsDelivery } from '../../types';
import { cn } from '../../lib/utils';

interface YmsAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: YmsDelivery | null;
  docks: YmsDock[];
  waitingAreas: YmsWaitingArea[];
  onAssignDock: (dockId: number, scheduledTime: string) => void;
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Plan Datum</label>
            <input 
              type="date" 
              className="w-full bg-card border border-border rounded-xl p-3 text-foreground"
              defaultValue={new Date().toISOString().split('T')[0]}
              id="assign-date"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Plan Tijd</label>
            <input 
              type="time" 
              className="w-full bg-card border border-border rounded-xl p-3 text-foreground"
              defaultValue={new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              id="assign-time"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="font-bold text-foreground flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" /> Beschikbare Docks
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {docks.filter(d => d.status === 'Available' || d.status === 'Scheduled').map(dock => {
              const isCompatible = !delivery.temperature || dock.allowedTemperatures.includes(delivery.temperature);
              return (
                <button
                  key={dock.id}
                  onClick={() => {
                    const date = (document.getElementById('assign-date') as HTMLInputElement).value;
                    const time = (document.getElementById('assign-time') as HTMLInputElement).value;
                    onAssignDock(dock.id, `${date}T${time}:00`);
                  }}
                  className={cn(
                    "flex flex-col items-start p-4 border rounded-2xl transition-all text-left relative overflow-hidden group",
                    isCompatible 
                      ? "bg-card border-border hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm"
                      : "bg-[var(--muted)]/20 border-dashed border-[var(--muted)] opacity-50 grayscale cursor-not-allowed"
                  )}
                  disabled={!isCompatible}
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className="font-bold text-foreground group-hover:text-indigo-600">{dock.name}</span>
                    {isCompatible && (
                      <Badge variant="success" className="text-[8px] h-4">Aanbevolen</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {dock.allowedTemperatures.map(t => (
                      <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-md bg-[var(--muted)]/50 text-[var(--muted-foreground)] font-bold uppercase truncate">
                        {t}
                      </span>
                    ))}
                  </div>
                  {!isCompatible && (
                    <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center pointer-events-none">
                       <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter rotate-12 border border-red-500 px-1">Temp Mismatch</span>
                    </div>
                  )}
                </button>
              );
            })}
            {docks.length === 0 && (
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
