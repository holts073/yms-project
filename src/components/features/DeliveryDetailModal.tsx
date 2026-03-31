import React, { useState, useEffect } from 'react';
import { Package, Truck, AlertCircle, FileText, Save, X } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Combobox } from '../ui/Combobox';
import { Delivery } from '../../types';
import { cn } from '../../lib/utils';

interface DeliveryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Partial<Delivery> | null;
  onSave: (delivery: any) => void;
  state: any; // Context state for suppliers/transporters/settings
}

const ComboboxWrapper = ({ name, options, defaultValue, placeholder }: any) => {
  const [val, setVal] = useState(defaultValue || (options.length > 0 ? options[0].value : ''));
  
  useEffect(() => {
    if (defaultValue !== undefined) setVal(defaultValue);
  }, [defaultValue]);

  return (
    <div className="w-full">
      <Combobox options={options} value={val} onChange={setVal} placeholder={placeholder} />
      <input type="hidden" name={name} value={val} />
    </div>
  );
};

export const DeliveryDetailModal: React.FC<DeliveryDetailModalProps> = ({
  isOpen,
  onClose,
  delivery: initialDelivery,
  onSave,
  state
}) => {
  const [editingDelivery, setEditingDelivery] = useState<Partial<Delivery> | null>(null);
  const [formType, setFormType] = useState<'container' | 'exworks'>('container');

  useEffect(() => {
    if (initialDelivery) {
      setEditingDelivery(initialDelivery);
      setFormType(initialDelivery.type || 'container');
    } else {
      setEditingDelivery({
        type: 'container',
        status: 0,
        documents: [],
        palletExchange: true,
        palletType: 'EUR',
        palletRate: state.settings?.pallet_rates?.EUR || 13
      });
      setFormType('container');
    }
  }, [initialDelivery, state.settings?.pallet_rates?.EUR]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const finalDelivery = {
      ...editingDelivery,
      ...data,
      status: editingDelivery?.status || 0,
      palletExchange: formData.get('palletExchange') === 'on',
      requiresQA: formData.get('requiresQA') === 'on',
      palletCount: parseInt(data.palletCount as string) || 0,
      weight: parseInt(data.weight as string) || 0,
      palletRate: parseFloat(data.palletRate as string) || 0,
      documents: editingDelivery?.documents || []
    };

    onSave(finalDelivery);
  };

  if (!editingDelivery) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingDelivery.id ? 'Levering Aanpassen' : 'Nieuwe Levering'}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Type</label>
               <select 
                 name="type" 
                 value={formType} 
                 onChange={(e) => setFormType(e.target.value as any)}
                 className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold"
               >
                  <option value="container">Container</option>
                  <option value="exworks">Ex-Works</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Referentie</label>
               <Input name="reference" defaultValue={editingDelivery.reference} placeholder="Bestelnummer / Ref" required />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Leverancier</label>
               <ComboboxWrapper 
                 name="supplierId" 
                 defaultValue={editingDelivery.supplierId} 
                 options={(state.addressBook?.suppliers || []).map((s:any) => ({ value: s.id, label: s.name }))}
                 placeholder="Zoek leverancier..." 
               />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Transporteur</label>
               <ComboboxWrapper 
                 name="transporterId" 
                 defaultValue={editingDelivery.transporterId} 
                 options={(state.addressBook?.transporters || []).map((s:any) => ({ value: s.id, label: s.name }))}
                 placeholder="Zoek transporteur..." 
               />
            </div>
            <Input label="ETA Magazijn" name="etaWarehouse" type="date" defaultValue={editingDelivery.etaWarehouse?.split('T')[0]} />
            
             <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Incoterms</label>
                <select name="incoterm" defaultValue={editingDelivery.incoterm || 'EXW'} className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold">
                   <option value="EXW">EXW</option>
                   <option value="FCA">FCA</option>
                   <option value="FOB">FOB</option>
                   <option value="CIF">CIF</option>
                   <option value="DDP">DDP</option>
                   <option value="DAP">DAP</option>
                </select>
             </div>

             {formType === 'container' && (
               <>
                 <Input label="Container nummer" name="containerNumber" defaultValue={editingDelivery.containerNumber} />
                 <Input label="Bill of Lading (B/L)" name="billOfLading" defaultValue={editingDelivery.billOfLading} />
                 <Input label="Haven van Aankomst" name="portOfArrival" defaultValue={editingDelivery.portOfArrival} />
                 <Input label="ETA Haven" name="etaPort" type="date" defaultValue={editingDelivery.etaPort?.split('T')[0]} />
               </>
             )}

             {formType === 'exworks' && (
               <>
                 <Input label="Kenteken" name="containerNumber" defaultValue={editingDelivery.containerNumber} />
                 <Input label="Laadstad" name="loadingCity" defaultValue={editingDelivery.loadingCity} />
                 <Input label="Laadland" name="loadingCountry" defaultValue={editingDelivery.loadingCountry} />
               </>
             )}

             <div className="grid grid-cols-2 gap-6">
                <Input label="Aantal Pallets" name="palletCount" type="number" defaultValue={editingDelivery.palletCount} />
                <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Lading Type</label>
                   <select name="cargoType" defaultValue={editingDelivery.cargoType || 'Dry'} className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold">
                      <option value="Dry">Droog</option>
                      <option value="Cool">Koel</option>
                      <option value="Frozen">Vries</option>
                   </select>
                </div>
             </div>
             <Input label="Gewicht (kg)" name="weight" type="number" defaultValue={editingDelivery.weight} />
             
             <div className="space-y-4 bg-card/50 p-4 rounded-2xl border border-border mt-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Pallet Type</label>
                    <select 
                      name="palletType" 
                      defaultValue={editingDelivery.palletType || 'EUR'} 
                      className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold"
                      onChange={(e) => {
                        const rates: any = state.settings?.pallet_rates || { 'EUR': 13, 'DPD': 22.5, 'CHEP': 0, 'BLOK': 15 };
                        const rateInput = document.getElementById('palletRate-modal') as HTMLInputElement;
                        if (rateInput) rateInput.value = rates[e.target.value] || '0';
                      }}
                    >
                       <option value="EUR">EUR (€{(state.settings?.pallet_rates?.EUR || 13).toFixed(2)})</option>
                       <option value="DPD">DPD (€{(state.settings?.pallet_rates?.DPD || 22.5).toFixed(2)})</option>
                       <option value="CHEP">CHEP (€{(state.settings?.pallet_rates?.CHEP || 0).toFixed(2)})</option>
                       <option value="BLOK">BLOK (€{(state.settings?.pallet_rates?.BLOK || 15).toFixed(2)})</option>
                    </select>
                 </div>
                 <Input 
                   label="Tarief (€)" 
                   name="palletRate" 
                   id="palletRate-modal"
                   type="number" 
                   step="0.01" 
                   defaultValue={editingDelivery.palletRate || 13} 
                 />
               </div>
             </div>

             <Input 
                as="textarea"
                label="Opmerkingen" 
                name="notes" 
                containerClassName="col-span-2"
                defaultValue={editingDelivery.notes} 
                placeholder="Voeg eventuele instructies of bijzonderheden toe..."
             />
             <div className="flex items-center gap-6 pt-6 pl-4">
                <div className="flex items-center gap-3">
                   <input type="checkbox" name="palletExchange" id="palletExchange-modal" defaultChecked={editingDelivery.id ? editingDelivery.palletExchange : true} className="w-5 h-5 rounded border-border text-indigo-600 focus:ring-indigo-500" />
                   <label htmlFor="palletExchange-modal" className="text-sm font-bold text-foreground">Palletruil Toepassen</label>
                </div>
                <div className="flex items-center gap-3">
                   <input type="checkbox" name="requiresQA" id="requiresQA-modal" defaultChecked={editingDelivery.requiresQA} className="w-5 h-5 rounded border-border text-amber-600 focus:ring-amber-500" />
                   <label htmlFor="requiresQA-modal" className="text-sm font-bold text-foreground flex items-center gap-2">
                     QA Inspectie benodigd
                     <AlertCircle size={14} className="text-amber-500" />
                   </label>
                </div>
             </div>
         </div>

         {/* Document Checklist */}
         {editingDelivery.id && (
           <div className="border-t border-border pt-6 mt-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-4">Documenten Checklist</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {(editingDelivery.documents || []).map((doc: any, idx: number) => (
                   <div key={doc.id} className="flex items-center justify-between p-3 bg-[var(--muted)]/50 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3">
                         <input 
                           type="checkbox" 
                           checked={doc.status === 'received'} 
                           onChange={() => {
                             const newDocs = [...(editingDelivery.documents || [])];
                             const wasReceived = newDocs[idx].status === 'received';
                             newDocs[idx] = { ...newDocs[idx], status: wasReceived ? 'pending' : 'received' };
                             
                             let currentStatus = editingDelivery.status || 0;
                             if (wasReceived && doc.required) {
                                if (currentStatus === 100) currentStatus = 75;
                                else if (currentStatus >= 75) currentStatus = 50;
                                else if (currentStatus >= 50) currentStatus = 25;
                             }
                             
                             setEditingDelivery({ ...editingDelivery, documents: newDocs, status: currentStatus });
                           }}
                           className="w-5 h-5 rounded border-border text-emerald-600 focus:ring-emerald-500"
                         />
                         <span className={cn("text-sm font-bold", doc.required ? "text-foreground" : "text-[var(--muted-foreground)]")}>
                           {doc.name} {doc.required && <span className="text-rose-500">*</span>}
                         </span>
                      </div>
                      <Badge variant={doc.status === 'received' ? 'success' : 'warning'} size="xs">
                         {doc.status === 'received' ? 'Gereed' : 'Wachtend'}
                      </Badge>
                   </div>
                 ))}
              </div>
           </div>
         )}

         <div className="flex gap-4 pt-6 border-t border-border">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Annuleren</Button>
            <Button type="submit" className="flex-1">Opslaan</Button>
         </div>
      </form>
    </Modal>
  );
};
