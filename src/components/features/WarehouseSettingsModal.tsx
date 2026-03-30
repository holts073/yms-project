import React from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { YmsWarehouse } from '../../types';
import { Settings2, Zap, Clock, Box } from 'lucide-react';

interface WarehouseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse: YmsWarehouse | null;
  onSave: (w: YmsWarehouse) => void;
}

export const WarehouseSettingsModal: React.FC<WarehouseSettingsModalProps> = ({
  isOpen,
  onClose,
  warehouse,
  onSave
}) => {
  const [edited, setEdited] = React.useState<YmsWarehouse | null>(null);

  React.useEffect(() => {
    if (warehouse) setEdited(warehouse);
  }, [warehouse, isOpen]);

  if (!edited) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Capaciteit Instellingen - ${edited.name}`}
      maxWidth="xl"
    >
      <div className="space-y-8 pb-4">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-4">
          <Settings2 className="text-indigo-600 mt-1 shrink-0" size={20} />
          <p className="text-sm text-indigo-900 dark:text-indigo-300 font-medium leading-relaxed">
            Configureer hoe de Yard-capaciteit en slot-duur worden berekend voor dit magazijn. Deze instellingen bepalen de visuele breedte van leveringen op de tijdlijn.
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-amber-500" />
                <label className="text-sm font-black uppercase tracking-wider text-foreground">Fast Lane Drempel</label>
              </div>
              <Input 
                data-testid="input-threshold"
                type="number"
                placeholder="Bijv. 12"
                value={edited.fastLaneThreshold || 0}
                onChange={(e) => setEdited({...edited, fastLaneThreshold: parseInt(e.target.value) || 0})}
              />
              <p className="text-[10px] text-[var(--muted-foreground)] font-bold italic">Max aantal pallets toegestaan aan een Fast Lane dock.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-blue-500" />
                  <label className="text-sm font-black uppercase tracking-wider text-foreground">Minuten per Pallet</label>
                </div>
                <Input 
                  data-testid="input-min-per-pallet"
                  type="number"
                  placeholder="Bijv. 2"
                  value={edited.minutesPerPallet || 0}
                  onChange={(e) => setEdited({...edited, minutesPerPallet: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Box size={16} className="text-emerald-500" />
                  <label className="text-sm font-black uppercase tracking-wider text-foreground">Opsteltijd (min)</label>
                </div>
                <Input 
                  data-testid="input-base-time"
                  type="number"
                  placeholder="Bijv. 15"
                  value={edited.baseUnloadingTime || 0}
                  onChange={(e) => setEdited({...edited, baseUnloadingTime: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] font-bold italic">
               Slot Duur = {edited.baseUnloadingTime}m base + ({edited.minutesPerPallet || 0}m × pallets)
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuleren</Button>
          <Button className="flex-1" onClick={() => { onSave(edited); onClose(); }}>Instellingen Opslaan</Button>
        </div>
      </div>
    </Modal>
  );
};
