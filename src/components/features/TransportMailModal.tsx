import * as React from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Mail, Send, User, MapPin, Package as PackageIcon, Info } from 'lucide-react';
import { Delivery } from '../../types';
import { toast } from 'sonner';

interface TransportMailModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  transporter: any;
  supplier: any;
}

export const TransportMailModal: React.FC<TransportMailModalProps> = ({ isOpen, onClose, delivery, transporter, supplier }) => {
  if (!delivery || !transporter) return null;

  const email = transporter.email || 'transport@ilgfood.com';
  const subject = `Transportopdracht: ${delivery.reference} - ${supplier?.name || 'Vracht'}`;
  
  const body = `
Geachte ${transporter.name},

Hierbij bevestigen wij de transportopdracht voor de volgende zending:

Referentie: ${delivery.reference}
Leverancier: ${supplier?.name || 'Onbekend'}
Lading: ${delivery.cargoType || 'Dry'}
Aantal Pallets: ${delivery.palletCount || 0} ${delivery.palletType || 'EUR'}
Gewicht: ${delivery.weight || 0} kg

Ophaaladres:
${supplier?.pickupAddress || supplier?.address || 'Zie bijlage / dossier'}

ETA Magazijn: ${delivery.etaWarehouse ? new Date(delivery.etaWarehouse).toLocaleDateString('nl-NL') : 'Nader te bepalen'}

Graag ontvangen wij een bevestiging van de planning.

Met vriendelijke groet,
ILG Foodgroup Logistiek
  `.trim();

  const handleSend = () => {
    toast.info('Transport Order PDF wordt gegenereerd...');
    window.open(`/api/deliveries/${delivery.id}/transport-order-pdf`, '_blank');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transport Mail Voorbereiden" maxWidth="2xl">
      <div className="space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-4">
          <div className="bg-white dark:bg-indigo-900 p-2 rounded-xl text-indigo-600 shadow-sm">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-1">Transporteur</p>
            <p className="font-bold text-foreground">{transporter.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 bg-[var(--muted)]/50 rounded-2xl border border-border/50">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-2">
                 <PackageIcon size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Lading Details</span>
              </div>
              <p className="text-sm font-bold text-foreground">{delivery.reference}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] font-bold">{delivery.palletCount || 0} Pallets • {delivery.cargoType || 'Droog'}</p>
           </div>
           <div className="p-4 bg-[var(--muted)]/50 rounded-2xl border border-border/50">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-2">
                 <MapPin size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Ophaalpunt</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{supplier?.name || 'Onbekend'}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] font-bold truncate">{supplier?.address || 'Geen adres'}</p>
           </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)] ml-2">Email Inhoud</label>
          <div className="bg-card border border-border rounded-2xl p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[250px] overflow-y-auto custom-scrollbar italic opacity-80">
            {body}
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
          <Info size={18} className="text-indigo-600" />
          <p className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 leading-tight">
            De PDF wordt gegenereerd in een nieuw venster voor verwerking.
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuleren</Button>
          <Button className="flex-1" leftIcon={<Send size={18} />} onClick={handleSend}>Genereer PDF</Button>
        </div>
      </div>
    </Modal>
  );
};
