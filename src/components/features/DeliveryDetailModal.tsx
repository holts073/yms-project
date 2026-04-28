import React, { useState, useEffect } from 'react';
import { Package, Truck, AlertCircle, FileText, Save, X, BadgeEuro } from 'lucide-react';
import { useSocket } from '../../SocketContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Modal } from '../shared/Modal';
import { FeatureGate } from '../shared/FeatureGate';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Combobox } from '../ui/Combobox';
import { Delivery } from '../../types';
import { cn } from '../../lib/utils';
import { GlossaryTerm } from '../shared/GlossaryTerm';

interface DeliveryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Partial<Delivery> | null;
  onSave: (delivery: Partial<Delivery>) => void;
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
  onSave
}) => {
  const [editingDelivery, setEditingDelivery] = useState<Partial<Delivery> | null>(null);
  const [formType, setFormType] = useState<'container' | 'exworks'>('container');
  const [activeTab, setActiveTab] = useState<'basis' | 'shipping' | 'customs' | 'finance'>('basis');
  const { socket, state, dispatch, currentUser } = useSocket();
  const { hasCapability, canAccess } = usePermissions();
  const [lastIncoterm, setLastIncoterm] = useState<string | null>(null);

  // Telex state for local UI interaction before save
  const [telexStatus, setTelexStatus] = useState<'In aanvraag' | 'Vrijgegeven' | undefined>(undefined);

  useEffect(() => {
    if (initialDelivery) {
      setEditingDelivery(initialDelivery);
      setFormType(initialDelivery.type || 'container');
    } else {
      // Get default documents based on type
      const defaultDocs = (state.settings?.shipment_settings?.[formType || 'container'] || []).map((d: any) => ({
        id: Math.random().toString(36).substring(2, 11),
        name: d.name,
        status: 'pending' as const,
        required: d.required,
        blocksMilestone: d.blocksMilestone || 100
      }));

      setEditingDelivery({
        type: formType || 'container',
        status: 0,
        documents: defaultDocs,
        palletExchange: true,
        palletType: 'EUR',
        palletRate: state.settings?.pallet_rates?.EUR || 13
      });
    }

    const handleIncotermResult = (data: { supplierId: string, incoterm: string }) => {
      if (editingDelivery?.supplierId === data.supplierId) {
        setLastIncoterm(data.incoterm);
      }
    };

    socket?.on("last_incoterm_result", handleIncotermResult);
    return () => {
      socket?.off("last_incoterm_result", handleIncotermResult);
    };
  }, [initialDelivery, formType, state.settings?.shipment_settings, state.settings?.pallet_rates?.EUR, socket, editingDelivery?.supplierId]);

  const handleSupplierChange = (supplierId: string) => {
    setEditingDelivery(prev => prev ? ({ ...prev, supplierId }) : null);
    dispatch("GET_LAST_INCOTERM", { supplierId });
  };

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
      demurrageDailyRate: parseFloat(data.demurrageDailyRate as string) || 0,
      standingTimeCost: parseFloat(data.standingTimeCost as string) || 0,
      thcCost: parseFloat(data.thcCost as string) || 0,
      customsCost: parseFloat(data.customsCost as string) || 0,
      freeTimeDays: parseInt(data.freeTimeDays as string) || 0,
      telexReleaseStatus: telexStatus,
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
      <div className="flex gap-2 p-1 bg-[var(--muted)] rounded-2xl mb-8 overflow-x-auto no-scrollbar">
        <button 
          type="button"
          onClick={() => setActiveTab('basis')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex-1 min-w-fit whitespace-nowrap",
            activeTab === 'basis' ? "bg-card text-foreground shadow-sm" : "text-[var(--muted-foreground)] hover:text-foreground"
          )}
        >
          Basis
        </button>
        {formType === 'container' && (
          <>
            <button 
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex-1 min-w-fit whitespace-nowrap",
                activeTab === 'shipping' ? "bg-card text-foreground shadow-sm" : "text-[var(--muted-foreground)] hover:text-foreground"
              )}
            >
              Scheepvaart
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('customs')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex-1 min-w-fit whitespace-nowrap",
                activeTab === 'customs' ? "bg-card text-foreground shadow-sm" : "text-[var(--muted-foreground)] hover:text-foreground"
              )}
            >
              Douane
            </button>
          </>
        )}
        <button 
          type="button"
          onClick={() => setActiveTab('finance')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex-1 min-w-fit whitespace-nowrap",
            activeTab === 'finance' ? "bg-card text-foreground shadow-sm" : "text-[var(--muted-foreground)] hover:text-foreground"
          )}
        >
          Financieel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {activeTab === 'basis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Type</label>
               <select 
                 name="type" 
                 value={formType} 
                 onChange={(e) => {
                   setFormType(e.target.value as any);
                 }}
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
                <div className="flex flex-col gap-1">
                  <Combobox 
                    options={(state.addressBook?.suppliers || []).map((s:any) => ({ value: s.id, label: s.name }))}
                    value={editingDelivery.supplierId || ''}
                    onChange={handleSupplierChange}
                    placeholder="Zoek leverancier..." 
                  />
                  <input type="hidden" name="supplierId" value={editingDelivery.supplierId || ''} />
                  {lastIncoterm && (
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight ml-2">
                      Laatst gebruikt: {lastIncoterm}
                    </p>
                  )}
                </div>
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
            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Bestemming Magazijn</label>
               <select 
                 name="warehouseId" 
                 defaultValue={editingDelivery.warehouseId || 'W01'} 
                 className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold"
               >
                  {(state.yms?.warehouses || []).map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
               </select>
            </div>
            <Input label="ETA Magazijn" name="etaWarehouse" type="date" defaultValue={editingDelivery.etaWarehouse?.split('T')[0]} />
            
            <div className="space-y-2">
                 <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)] flex justify-between">
                    Incoterms
                    {lastIncoterm && (
                      <button 
                        type="button"
                        onClick={() => {
                          const select = document.getElementById('incoterm-select') as HTMLSelectElement;
                          if (select) select.value = lastIncoterm;
                        }}
                        className="text-[9px] text-indigo-600 hover:underline"
                      >
                        Gebruik {lastIncoterm}
                      </button>
                    )}
                 </label>
                 <select 
                   id="incoterm-select"
                   name="incoterm" 
                   defaultValue={editingDelivery.incoterm || lastIncoterm || (formType === 'container' ? state.settings?.default_incoterms?.container : state.settings?.default_incoterms?.exworks) || 'EXW'} 
                   className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold"
                 >
                    <option value="EXW">EXW</option>
                    <option value="FCA">FCA</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                    <option value="DDP">DDP</option>
                    <option value="DAP">DAP</option>
                    <option value="CIP">CIP</option>
                    <option value="CFR">CFR</option>
                    <option value="DPU">DPU</option>
                 </select>
            </div>

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
            
            {formType === 'exworks' && (
              <>
                <Input label="Kenteken" name="containerNumber" defaultValue={editingDelivery.containerNumber} />
                <Input label="Laadstad" name="loadingCity" defaultValue={editingDelivery.loadingCity} />
                <Input label="Laadland" name="loadingCountry" defaultValue={editingDelivery.loadingCountry} />
              </>
            )}

            <Input 
                as="textarea"
                label="Opmerkingen" 
                name="notes" 
                containerClassName="md:col-span-2"
                defaultValue={editingDelivery.notes} 
                placeholder="Voeg eventuele instructies of bijzonderheden toe..."
             />

             <div className="flex items-center gap-6 pt-6 pl-4 md:col-span-2">
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
        )}

        {activeTab === 'shipping' && formType === 'container' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4 md:col-span-2 bg-indigo-50/5 p-6 rounded-3xl border border-indigo-500/10 mb-2">
              <h4 className="text-xs font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" />
                Transportdocument & <GlossaryTerm id="telex">Telex Vrijgave</GlossaryTerm>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Document Type</label>
                  <select 
                    name="documentType" 
                    defaultValue={editingDelivery.documentType || 'B/L'} 
                    className="w-full p-3 bg-card border border-border rounded-xl text-sm font-bold"
                  >
                    <option value="B/L">Cognossement (B/L)</option>
                    <option value="SWB">Sea Waybill (SWB)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Telex Vrijgave Status</label>
                  <select 
                    name="telexReleaseStatus" 
                    defaultValue={editingDelivery.telexReleaseStatus}
                    onChange={(e: any) => setTelexStatus(e.target.value)}
                    className="w-full p-3 bg-card border border-border rounded-xl text-sm font-bold"
                  >
                    <option value="">Niet van toepassing</option>
                    <option value="In aanvraag">In aanvraag</option>
                    <option value="Vrijgegeven">Vrijgegeven</option>
                  </select>
                </div>
                <Input label="Telex Referentie" name="telexReleaseReference" defaultValue={editingDelivery.telexReleaseReference} placeholder="Telex ref nr." />
                {editingDelivery.telexReleaseDate && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Vrijgegeven Op</label>
                    <p className="text-sm font-bold text-emerald-600">{new Date(editingDelivery.telexReleaseDate).toLocaleString('nl-NL')}</p>
                    <p className="text-[9px] font-bold text-[var(--muted-foreground)]">Door: {editingDelivery.telexReleasedBy}</p>
                  </div>
                )}
              </div>
            </div>

            <Input label="Container nummer" name="containerNumber" defaultValue={editingDelivery.containerNumber} placeholder="MSCU1234567" />
            <Input label="Bill of Lading (B/L)" name="billOfLading" defaultValue={editingDelivery.billOfLading} />
            
            {state.settings?.enableContainerImportFields && (
              <>
                <Input label="Rederij" name="shippingLine" defaultValue={editingDelivery.shippingLine} placeholder=" bijv. Maersk, MSC" />
                <Input label="Scheepsnaam" name="vesselName" defaultValue={editingDelivery.vesselName} />
                <Input label="Reisno. (Voyage)" name="voyageNumber" defaultValue={editingDelivery.voyageNumber} />
                <Input label="Terminal" name="dischargeTerminal" defaultValue={editingDelivery.dischargeTerminal} />
                <Input label="Haven van Aankomst" name="portOfArrival" defaultValue={editingDelivery.portOfArrival} />
                <Input label="Loshaven (Discharge)" name="portOfDischarge" defaultValue={editingDelivery.portOfDischarge} />
              </>
            )}
            
            <Input label="Zegelnummer (Seal)" name="containerSealNumber" defaultValue={editingDelivery.containerSealNumber} />
            <Input label="ETA Port" name="etaPort" type="date" defaultValue={editingDelivery.etaPort?.split('T')[0]} />
          </div>
        )}

        {activeTab === 'customs' && formType === 'container' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Douane Status</label>
                <select name="customsStatus" defaultValue={editingDelivery.customsStatus || 'Pending'} className="w-full p-4 bg-[var(--muted)] border-border rounded-2xl text-sm font-bold">
                   <option value="Pending">Nog niet ingediend</option>
                   <option value="In aanvraag">In aanvraag</option>
                   <option value="Cleared">Vrijgegeven (Cleared)</option>
                   <option value="Inspection">Fysieke Controle</option>
                </select>
             </div>
             <Input label="MRN Nummer (ATC)" name="customsDeclarationNumber" defaultValue={editingDelivery.customsDeclarationNumber} placeholder="Movement Ref Nr" />
             {editingDelivery.customsClearedDate && (
               <div className="space-y-1">
                 <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Vrijgegeven op</label>
                 <p className="p-4 bg-[var(--muted)] rounded-2xl text-sm font-bold text-emerald-600">
                   {new Date(editingDelivery.customsClearedDate).toLocaleString('nl-NL')}
                 </p>
               </div>
             )}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <FeatureGate capability="FINANCE_LEDGER_VIEW" feature="enableFinance" mode="gate" compact>
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                  <BadgeEuro size={14} className="text-rose-500" />
                  Financiële Details & Kosten
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-rose-50/5 p-6 rounded-3xl border border-rose-500/10">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Pallet Type</label>
                         <select 
                           name="palletType" 
                           defaultValue={editingDelivery.palletType || 'EUR'} 
                           className="w-full p-3 bg-[var(--muted)] border-border rounded-xl text-sm font-bold"
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
                        label="Pallet Tarief (€)" 
                        name="palletRate" 
                        id="palletRate-modal"
                        type="number" 
                        step="0.01" 
                        defaultValue={editingDelivery.palletRate || 13} 
                      />
                    </div>
                    
                    <Input 
                      label="Demurrage Dagtarief (€)" 
                      name="demurrageDailyRate" 
                      type="number" 
                      step="0.01" 
                      defaultValue={editingDelivery.demurrageDailyRate || 0} 
                    />
                    
                    {state.settings?.featureFlags?.enableCostControl && (
                      <Input 
                        label="Vrije Dagen (Free Time)" 
                        name="freeTimeDays" 
                        type="number" 
                        step="1" 
                        defaultValue={editingDelivery.freeTimeDays || 0} 
                      />
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Standgeld/u (€)" name="standingTimeCost" type="number" step="0.01" defaultValue={editingDelivery.standingTimeCost || 0} />
                      <Input label="THC Kosten (€)" name="thcCost" type="number" step="0.01" defaultValue={editingDelivery.thcCost || 0} />
                    </div>
                    <Input label="Douanekosten (€)" name="customsCost" type="number" step="0.01" defaultValue={editingDelivery.customsCost || 0} />
                  </div>
                </div>
              </div>
            </FeatureGate>
          </div>
        )}

        {/* Document Checklist - Always at the bottom if not ex-works or specific view */}
        <div className="border-t border-border pt-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                Documenten Checklist
              </h4>
              <Badge variant="outline" size="xs" className="font-bold border-indigo-500/20 text-indigo-600 uppercase">Verplicht gemarkeerd met *</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {(editingDelivery.documents || []).map((doc: any, idx: number) => {
                 const tM = doc.blocksMilestone || 100;
                 const milestones = editingDelivery.type === 'container' ? [0, 25, 40, 50, 75, 100] : [0, 25, 50, 75, 100];
                 const currentStatus = editingDelivery.status || 0;
                 const nextMilestone = milestones.find(m => m > currentStatus) || 100;
                 
                 const isCritical = doc.required && doc.status !== 'received' && tM <= nextMilestone;
                 const milestoneLabel = tM === 100 ? 'Inchecken' : (tM === 40 ? 'DOUANE' : (tM === 25 ? 'Transport' : (tM === 50 ? 'In Transit' : (tM === 75 ? 'Aankomst' : 'Volgende Stap'))));

                 return (
                  <div key={doc.id} className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    doc.status === 'received' ? "bg-emerald-50/10 border-emerald-500/20" : "bg-[var(--muted)]/50 border-border/50",
                    isCritical && "border-rose-500/30 bg-rose-50/5 shadow-sm"
                  )}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={doc.status === 'received'} 
                          onChange={() => {
                            const newDocs = [...(editingDelivery.documents || [])];
                            const wasReceived = newDocs[idx].status === 'received';
                            newDocs[idx] = { ...newDocs[idx], status: wasReceived ? 'pending' : 'received' };
                            setEditingDelivery({ ...editingDelivery, documents: newDocs });
                          }}
                          className="w-5 h-5 rounded border-border text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className={cn("text-sm font-bold", isCritical ? "text-rose-600" : "text-foreground")}>
                             {doc.name} {doc.required && '*'}
                          </p>
                          {doc.required && (
                            <p className={cn("text-[10px] font-bold uppercase tracking-tight", isCritical ? "text-rose-500/80" : "text-[var(--muted-foreground)]")}>
                              Benodigd voor {milestoneLabel}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={doc.status === 'received' ? 'success' : (isCritical ? 'danger' : (doc.required ? 'warning' : 'info'))} size="xs">
                        {doc.status === 'received' ? 'Gereed' : (doc.required ? 'Verplicht' : 'Optioneel')}
                      </Badge>
                  </div>
                 );
               })}
            </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-border">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Annuleren</Button>
          <Button type="submit" className="flex-1">Opslaan</Button>
        </div>
      </form>
    </Modal>
  );
};
