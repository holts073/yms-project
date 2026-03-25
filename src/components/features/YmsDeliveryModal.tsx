import React from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { YmsDelivery, YmsTemperature, YmsWarehouse } from '../../types';
import { Combobox } from '../ui/Combobox';

interface YmsDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Partial<YmsDelivery> | null;
  onSave: (d: Partial<YmsDelivery>) => void;
  onUpdateEditing: (d: Partial<YmsDelivery>) => void;
  suppliers: any[];
  transporters: any[];
  warehouses: YmsWarehouse[];
  docks: any[];
  waitingAreas: any[];
}

export const YmsDeliveryModal: React.FC<YmsDeliveryModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onSave,
  onUpdateEditing,
  suppliers,
  transporters,
  warehouses,
  docks,
  waitingAreas
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={delivery?.id ? 'Levering Bewerken' : 'Nieuwe Levering'}
      maxWidth="lg"
    >
      <div className="space-y-6 pb-4">
        <div className="grid grid-cols-2 gap-6">
          <Input 
            label="Referentie"
            value={delivery?.reference || ''}
            onChange={(e) => onUpdateEditing({...delivery, reference: e.target.value})}
          />
          <Input 
            label="Kenteken"
            className="uppercase tracking-wider"
            value={delivery?.licensePlate || ''}
            onChange={(e) => onUpdateEditing({...delivery, licensePlate: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">Leverancier</label>
            <Combobox 
              value={delivery?.supplierId || ''}
              onChange={(val) => onUpdateEditing({...delivery, supplierId: val})}
              options={suppliers.map(s => ({ value: s.id, label: s.name }))}
              placeholder="Zoek leverancier..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground">Transporteur</label>
            <Combobox 
              value={delivery?.transporterId || ''}
              onChange={(val) => onUpdateEditing({...delivery, transporterId: val})}
              options={transporters.map(t => ({ value: t.id, label: t.name }))}
              placeholder="Zoek transporteur..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Input 
            label="Tijd (HH:mm)"
            type="time"
            value={delivery?.scheduledTime ? new Date(delivery.scheduledTime).toTimeString().substr(0, 5) : ''}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':');
              const d = new Date(delivery?.scheduledTime || new Date());
              d.setHours(parseInt(h), parseInt(m), 0, 0);
              onUpdateEditing({...delivery, scheduledTime: d.toISOString()});
            }}
          />
          <Input 
            as="select"
            label="Temperatuur"
            value={delivery?.temperature || 'Droog'}
            onChange={(e) => onUpdateEditing({...delivery, temperature: e.target.value as YmsTemperature})}
          >
            <option value="Droog">Droog</option>
            <option value="Koel">Koel</option>
            <option value="Vries">Vries</option>
          </Input>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Input 
            as="select"
            label="Richting"
            value={delivery?.direction || 'INBOUND'}
            onChange={(e) => onUpdateEditing({...delivery, direction: e.target.value as any})}
          >
            <option value="INBOUND">Inbound (Lossen)</option>
            <option value="OUTBOUND">Outbound (Laden)</option>
          </Input>
          <Input 
            type="number"
            label="Pallets"
            value={delivery?.palletCount || 0}
            onChange={(e) => onUpdateEditing({...delivery, palletCount: parseInt(e.target.value) || 0})}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Input 
            as="select"
            label="Aangedockt bij"
            value={delivery?.dockId || ''}
            onChange={(e) => onUpdateEditing({...delivery, dockId: e.target.value ? parseInt(e.target.value) : undefined})}
          >
            <option value="">Geen</option>
            {docks.map(dk => <option key={dk.id} value={dk.id}>{dk.name}</option>)}
          </Input>
          <Input 
            as="select"
            label="Wachtplaats"
            value={delivery?.waitingAreaId || ''}
            onChange={(e) => onUpdateEditing({...delivery, waitingAreaId: e.target.value ? parseInt(e.target.value) : undefined})}
          >
            <option value="">Geen</option>
            {waitingAreas.map(wa => <option key={wa.id} value={wa.id}>Wachtplaats {wa.id}</option>)}
          </Input>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuleren</Button>
          <Button className="flex-1" onClick={() => onSave(delivery!)}>Opslaan</Button>
        </div>
      </div>
    </Modal>
  );
};
