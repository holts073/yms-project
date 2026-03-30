import React from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { AddressEntry } from '../../types';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: Partial<AddressEntry> | null;
  onSave: (e: React.FormEvent) => void;
  onUpdateEditing: (u: any) => void;
  category: 'suppliers' | 'transporters' | 'customers';
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSave,
  onUpdateEditing,
  category
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry?.id ? 'Contact Aanpassen' : 'Nieuw Contact'}
      maxWidth="lg"
    >
      <form onSubmit={onSave} className="space-y-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Bedrijfsnaam"
            required
            value={entry?.name || ''}
            onChange={e => onUpdateEditing({ ...entry, name: e.target.value })}
          />
          {category === 'suppliers' && (
            <Input 
              label="Leveranciersnummer"
              placeholder="Bijv. LEV-1001"
              value={(entry as any)?.supplier_number || ''}
              onChange={e => onUpdateEditing({ ...entry, supplier_number: e.target.value })}
            />
          )}
          {category === 'customers' && (
            <Input 
              label="Klantnummer"
              placeholder="Bijv. KLA-2002"
              value={(entry as any)?.customer_number || ''}
              onChange={e => onUpdateEditing({ ...entry, customer_number: e.target.value })}
            />
          )}
        </div>
        <Input 
          label="Contactpersoon"
          required
          value={entry?.contact || ''}
          onChange={e => onUpdateEditing({ ...entry, contact: e.target.value })}
        />
        <Input 
          label="E-mailadres"
          required
          type="email"
          value={entry?.email || ''}
          onChange={e => onUpdateEditing({ ...entry, email: e.target.value })}
        />
        <Input 
          as="textarea"
          label="Adres"
          rows={2}
          value={entry?.address || ''}
          onChange={e => onUpdateEditing({ ...entry, address: e.target.value })}
        />

        {category === 'suppliers' && (
          <Input 
            as="textarea"
            label="Afhaaladres (Pickup Address)"
            rows={2}
            value={entry?.pickupAddress || ''}
            onChange={e => onUpdateEditing({ ...entry, pickupAddress: e.target.value })}
            placeholder="Adres waar de goederen worden afgehaald..."
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            as="textarea"
            label="Opmerkingen"
            rows={2}
            value={entry?.remarks || ''}
            onChange={e => onUpdateEditing({ ...entry, remarks: e.target.value })}
            placeholder="Algemene opmerkingen over deze relatie..."
          />
          <Input 
            label="Pallet Tarief (€)"
            type="number"
            step="0.01"
            value={entry?.pallet_rate || 0}
            onChange={e => onUpdateEditing({ ...entry, pallet_rate: parseFloat(e.target.value) })}
            placeholder="Bijv. 15.50"
          />
        </div>

        <div className="pt-4 flex gap-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuleren</Button>
          <Button type="submit" className="flex-1">
            {entry?.id ? 'Opslaan' : 'Toevoegen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
