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
  palletRates?: Record<string, number>;
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
  waitingAreas,
  palletRates = { 'EUR': 13, 'DPD': 22.5, 'CHEP': 0, 'BLOK': 15 }
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={delivery?.id ? 'Levering Bewerken' : 'Nieuwe Levering'}
      maxWidth="3xl"
    >
      <div className="space-y-6 pb-4">
        <div className="grid grid-cols-2 gap-6">
          <Input 
            label="Referentie"
            data-testid="input-reference"
            value={delivery?.reference || ''}
            onChange={(e) => onUpdateEditing({...delivery, reference: e.target.value})}
          />
          <Input 
            label="Kenteken"
            data-testid="input-license"
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
              onChange={(val) => {
                const s = suppliers.find(sup => sup.id === val);
                onUpdateEditing({
                  ...delivery, 
                  supplierId: val,
                  palletRate: (delivery?.palletRate === undefined || delivery?.palletRate === 0) ? (s?.pallet_rate || 13) : delivery?.palletRate
                });
              }}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Tijd (HH:mm)"
            type="time"
            data-testid="input-scheduled-time"
            value={delivery?.scheduledTime ? new Date(delivery.scheduledTime).toTimeString().substr(0, 5) : ''}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':');
              const d = new Date(delivery?.scheduledTime || new Date());
              d.setHours(parseInt(h), parseInt(m), 0, 0);
              onUpdateEditing({...delivery, scheduledTime: d.toISOString()});
            }}
          />
          <div className="grid grid-cols-2 gap-4">
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
            <Input 
              as="select"
              label="Richting"
              value={delivery?.direction || 'INBOUND'}
              onChange={(e) => onUpdateEditing({...delivery, direction: e.target.value as any})}
            >
              <option value="INBOUND">Inbound</option>
              <option value="OUTBOUND">Outbound</option>
            </Input>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
          <Input 
            as="select"
            label="Pallet Type"
            value={delivery?.palletType || 'EUR'}
            onChange={(e) => {
              const type = e.target.value;
              const rates: any = palletRates;
              onUpdateEditing({
                ...delivery, 
                palletType: type as any,
                palletRate: rates[type] || 0
              });
            }}
          >
            <option value="EUR">EUR (€{(palletRates?.EUR || 13).toFixed(2)})</option>
            <option value="DPD">DPD (€{(palletRates?.DPD || 22.5).toFixed(2)})</option>
            <option value="CHEP">CHEP (€{(palletRates?.CHEP || 0).toFixed(2)})</option>
            <option value="BLOK">BLOK (€{(palletRates?.BLOK || 15).toFixed(2)})</option>
          </Input>
          <div className="grid grid-cols-2 gap-4">
             <Input 
                type="number"
                label="Aantal"
                data-testid="input-pallets"
                value={delivery?.palletCount || 0}
                onChange={(e) => onUpdateEditing({...delivery, palletCount: parseInt(e.target.value) || 0})}
              />
              <Input 
                type="number"
                step="0.01"
                label="Tarief (€)"
                value={delivery?.palletRate || 0}
                onChange={(e) => onUpdateEditing({...delivery, palletRate: parseFloat(e.target.value) || 0})}
              />
          </div>
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
          <Button data-testid="btn-save-delivery" className="flex-1" onClick={() => onSave(delivery!)}>Opslaan</Button>
        </div>
      </div>
    </Modal>
  );
};
