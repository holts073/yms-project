import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Plus, Save, RotateCcw, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WarehouseManager } from './features/WarehouseManager';
import { DockManager } from './features/DockManager';
import { WaitingAreaManager } from './features/WaitingAreaManager';
import { Modal } from './shared/Modal';
import { Input } from './shared/Input';
import { Button } from './shared/Button';
import { Card } from './shared/Card';
import { Badge } from './shared/Badge';
import { YmsWarehouse } from '../types';

export default function YmsSettings() {
  const { state, dispatch } = useSocket();
  const [activeTab, setActiveTab] = useState<'warehouses' | 'capacity' | 'docks' | 'waitingAreas' | 'overrides' | 'pallets' | 'operation' | 'modules'>('warehouses');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('W01');
  const [editingWarehouse, setEditingWarehouse] = useState<Partial<YmsWarehouse> | null>(null);
  const [palletRates, setPalletRates] = useState<Record<string, number>>(state.settings?.pallet_rates || { EUR: 13, DPD: 22.5, CHEP: 0, BLOK: 15 });
  
  if (!state?.yms) return null;
  const { warehouses = [], docks = [], waitingAreas = [] } = state.yms;

  const handleSaveWarehouse = (w: Partial<YmsWarehouse>) => {
    if (!w.name) return;
    dispatch('YMS_SAVE_WAREHOUSE', { ...w, id: w.id || `W0${warehouses.length + 1}` });
    setEditingWarehouse(null);
  };

  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-4xl font-black text-foreground tracking-tight">YMS Systeeminstellingen</h2>
        <p className="text-[var(--muted-foreground)] mt-1 font-medium">Configureer de digitale tweeling van jouw logistieke terrein.</p>
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-2 p-1.5 bg-card border border-border rounded-3xl w-fit shadow-sm" data-testid="settings-tabs">
          {[
            { id: 'warehouses', label: 'Magazijnen' },
            { id: 'capacity', label: 'Capaciteit' },
            { id: 'docks', label: 'Docks' },
            { id: 'waitingAreas', label: 'Wachtruimtes' },
            { id: 'overrides', label: 'Overrides' },
            { id: 'pallets', label: 'Pallets' },
            { id: 'operation', label: 'Operatie' },
            { id: 'modules', label: 'Modules' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' 
                  : 'text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--muted)]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'warehouses' && (
          <div className="flex items-center gap-4 bg-card p-2 rounded-2xl border border-border shadow-sm">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)] ml-2">Locatie:</span>
            <select 
              value={selectedWarehouseId} 
              onChange={e => setSelectedWarehouseId(e.target.value)}
              className="bg-[var(--muted)] border-none text-sm font-bold text-foreground py-2 px-4 rounded-xl outline-none"
            >
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab} 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -10 }}
          className="space-y-8"
        >
          {activeTab === 'warehouses' && (
            <WarehouseManager 
              warehouses={warehouses}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
              onEdit={setEditingWarehouse}
              onDelete={(id) => confirm('Verwijderen?') && dispatch('YMS_DELETE_WAREHOUSE', id)}
              dockCount={(id) => docks.filter(d => d.warehouseId === id).length}
            />
          )}

          {activeTab === 'capacity' && (
            <div className="max-w-4xl space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual Preview */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Calendar size={120} />
                  </div>
                  <h4 className="text-xl font-black mb-4 uppercase tracking-tight">Capaciteits Profiel</h4>
                  <p className="text-indigo-100 text-sm leading-relaxed mb-8 opacity-80 font-medium">
                    De onderstaande waarden bepalen hoe lang een levering een dock bezet houdt op de planning.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">Geselecteerd Magazijn</span>
                      <span className="font-bold">{warehouses.find(w => w.id === selectedWarehouseId)?.name || 'Onbekend'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">Berekening Slot-duur</span>
                      <span className="font-bold">
                        {warehouses.find(w => w.id === selectedWarehouseId)?.baseUnloadingTime || 0}m base + 
                        ({warehouses.find(w => w.id === selectedWarehouseId)?.minutesPerPallet || 0}m × pallets)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Settings Form */}
                <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <Input 
                      label="Basis Lostijd (minuten)" 
                      type="number" 
                      value={warehouses.find(w => w.id === selectedWarehouseId)?.baseUnloadingTime || 0}
                      onChange={e => {
                        const w = warehouses.find(wh => wh.id === selectedWarehouseId);
                        if (w) dispatch('YMS_SAVE_WAREHOUSE', { ...w, baseUnloadingTime: parseInt(e.target.value) || 0 });
                      }}
                    />
                    <Input 
                      label="Minuten per Pallet" 
                      type="number" 
                      value={warehouses.find(w => w.id === selectedWarehouseId)?.minutesPerPallet || 0}
                      onChange={e => {
                        const w = warehouses.find(wh => wh.id === selectedWarehouseId);
                        if (w) dispatch('YMS_SAVE_WAREHOUSE', { ...w, minutesPerPallet: parseInt(e.target.value) || 0 });
                      }}
                    />
                    <Input 
                      label="Fast Lane Drempel (pallets)" 
                      type="number" 
                      value={warehouses.find(w => w.id === selectedWarehouseId)?.fastLaneThreshold || 0}
                      onChange={e => {
                        const w = warehouses.find(wh => wh.id === selectedWarehouseId);
                        if (w) dispatch('YMS_SAVE_WAREHOUSE', { ...w, fastLaneThreshold: parseInt(e.target.value) || 0 });
                      }}
                    />
                    
                    <div className="flex items-center gap-3 p-4 bg-[var(--muted)]/50 rounded-2xl border border-border mt-2">
                      <input 
                        type="checkbox" 
                        id="hasGate-settings" 
                        checked={!!warehouses.find(w => w.id === selectedWarehouseId)?.hasGate} 
                        onChange={e => {
                          const w = warehouses.find(wh => wh.id === selectedWarehouseId);
                          if (w) dispatch('YMS_SAVE_WAREHOUSE', { ...w, hasGate: e.target.checked });
                        }}
                        className="w-5 h-5 rounded-md border-border text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="hasGate-settings" className="text-sm font-bold text-foreground cursor-pointer">
                        Toegangspoort (Gate-In registratie) actief?
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docks' && (
            <DockManager 
              docks={docks}
              warehouseId={selectedWarehouseId}
              onUpdate={(d) => dispatch('YMS_SAVE_DOCK', d)}
            />
          )}

          {activeTab === 'waitingAreas' && (
            <WaitingAreaManager 
              waitingAreas={waitingAreas}
              warehouseId={selectedWarehouseId}
              onUpdate={(wa) => dispatch('YMS_SAVE_WAITINGAREA', wa)}
            />
          )}

          {activeTab === 'overrides' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-foreground">Dock Overrides</h3>
                <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => dispatch('YMS_SAVE_DOCKOVERRIDE', {
                  id: Math.random().toString(36).substr(2, 9),
                  dockId: docks[0]?.id || 1,
                  warehouseId: selectedWarehouseId,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  status: 'Blocked',
                  allowedTemperatures: ['Droog']
                })}>
                  Override Toevoegen
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {(state.yms.dockOverrides || [])
                  .filter(o => o.warehouseId === selectedWarehouseId)
                  .map(override => (
                  <div key={override.id} className="bg-card border border-border p-6 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex gap-8 items-center">
                      <div>
                        <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">Dock</p>
                        <p className="font-bold text-foreground">#{override.dockId} - {docks.find(d => d.id === override.dockId)?.name || 'Onbekend'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">Periode</p>
                        <p className="font-bold text-foreground">{override.startDate} t/m {override.endDate}</p>
                      </div>
                      <Badge variant={override.status === 'Blocked' ? 'danger' : 'success'}>
                        {override.status === 'Blocked' ? 'GEBLOKKEERD' : 'BESCHIKBAAR'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => dispatch('YMS_DELETE_DOCKOVERRIDE', override.id)} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                      Verwijderen
                    </Button>
                  </div>
                ))}
                
                {(state.yms.dockOverrides || []).filter(o => o.warehouseId === selectedWarehouseId).length === 0 && (
                  <div className="py-20 text-center bg-[var(--muted)]/30 rounded-3xl border border-dashed border-border italic text-[var(--muted-foreground)]">
                    Geen actieve overrides gevonden voor dit magazijn.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pallets' && (
            <div className="max-w-2xl space-y-8">
               <header>
                 <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Financieel Beheer: Pallets</h3>
                 <p className="text-[var(--muted-foreground)] text-sm">Beheer de standaardtarieven die worden gebruikt voor berekeningen in het dock- en palletgrootboek.</p>
               </header>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border p-8 rounded-3xl shadow-sm">
                  <Input 
                    type="number" 
                    step="0.01" 
                    label="EUR Pallet (€)" 
                    value={palletRates.EUR} 
                    onChange={e => setPalletRates({...palletRates, EUR: parseFloat(e.target.value) || 0})} 
                  />
                  <Input 
                    type="number" 
                    step="0.01" 
                    label="DPD Pallet (€)" 
                    value={palletRates.DPD} 
                    onChange={e => setPalletRates({...palletRates, DPD: parseFloat(e.target.value) || 0})} 
                  />
                  <Input 
                    type="number" 
                    step="0.01" 
                    label="CHEP Pallet (€)" 
                    value={palletRates.CHEP} 
                    onChange={e => setPalletRates({...palletRates, CHEP: parseFloat(e.target.value) || 0})} 
                  />
                  <Input 
                    type="number" 
                    step="0.01" 
                    label="BLOK Pallet (€)" 
                    value={palletRates.BLOK} 
                    onChange={e => setPalletRates({...palletRates, BLOK: parseFloat(e.target.value) || 0})} 
                  />
                  
                  <div className="md:col-span-2 pt-4 border-t border-border mt-4 flex justify-end">
                    <Button 
                      variant="primary" 
                      leftIcon={<Save size={18} />} 
                      onClick={() => dispatch('SAVE_SETTING', { key: 'pallet_rates', value: palletRates })}
                    >
                      Tarieven Opslaan
                    </Button>
                  </div>
               </div>
            </div>
          )}
          
          {activeTab === 'operation' && (
            <div className="max-w-3xl space-y-8">
               <header>
                 <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Operationele Configuratie</h3>
                 <p className="text-[var(--muted-foreground)] text-sm">Beheer de regels voor de Priority Queue, data-cycli en douane workflow.</p>
               </header>
               
               <div className="grid grid-cols-1 gap-8">
                 <Card padding="xl" className="space-y-6">
                    <h4 className="text-lg font-bold text-foreground">Aankomst & Douane</h4>
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between p-4 bg-[var(--muted)]/50 rounded-2xl border border-border">
                        <div className="space-y-1">
                          <p className="font-bold text-foreground uppercase tracking-tight text-sm">MRN Clearance Verplicht</p>
                          <p className="text-xs text-[var(--muted-foreground)] font-medium">Vereist registratie van een MRN nummer (Douane) voordat een levering naar 'Cleared' kan springen.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!state.settings?.requireMrnForClearance} 
                            onChange={e => dispatch('SAVE_SETTING', { key: 'requireMrnForClearance', value: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[var(--muted)]/50 rounded-2xl border border-border">
                        <div className="space-y-1">
                          <p className="font-bold text-foreground uppercase tracking-tight text-sm">Uitgebreide Zeevracht Velden</p>
                          <p className="text-xs text-[var(--muted-foreground)] font-medium">Toon rederij, scheepsnaam, terminal en reisnummer in het leveringsformulier.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!state.settings?.enableContainerImportFields} 
                            onChange={e => dispatch('SAVE_SETTING', { key: 'enableContainerImportFields', value: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>
                 </Card>

                 <Card padding="xl" className="space-y-6">
                    <h4 className="text-lg font-bold text-foreground">Priority Queue Scoring</h4>
                    <p className="text-xs text-[var(--muted-foreground)]">De Smart Score in de wachtrij wordt berekend door o.a. het temperatuur-type en eventuele uitgaande flow prioriteit.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                      <Input 
                        label="Gewicht: Reefer (Koel/Vries) (+)" 
                        type="number"
                        value={state.settings?.priority_weights?.reefer || 50}
                        onChange={e => dispatch('SAVE_SETTING', { key: 'priority_weights', value: { ...state.settings?.priority_weights, reefer: parseInt(e.target.value) || 50 }})}
                      />
                      <Input 
                        label="Gewicht: Outbound Lading (+)" 
                        type="number"
                        value={state.settings?.priority_weights?.outbound || 30}
                        onChange={e => dispatch('SAVE_SETTING', { key: 'priority_weights', value: { ...state.settings?.priority_weights, outbound: parseInt(e.target.value) || 30 }})}
                      />
                    </div>
                 </Card>
                 
                 <Card padding="xl" className="space-y-6">
                    <h4 className="text-lg font-bold text-foreground">Automatische Archivering</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                      <Input 
                        label="Verberg na voltooiing (dagen)" 
                        type="number"
                        value={state.settings?.archive_days || 3}
                        onChange={e => dispatch('SAVE_SETTING', { key: 'archive_days', value: parseInt(e.target.value) || 3 })}
                      />
                    </div>
                 </Card>
               </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="max-w-2xl space-y-8">
               <header>
                 <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Systeem Modules</h3>
                 <p className="text-[var(--muted-foreground)] text-sm">Schakel specifieke functionaliteiten in of uit om de interface en logica te stroomlijnen.</p>
               </header>
               
               <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[var(--muted)]/50 rounded-2xl border border-border">
                    <div className="space-y-1">
                      <p className="font-black text-foreground uppercase tracking-tight text-sm">Financiële Module</p>
                      <p className="text-xs text-[var(--muted-foreground)] font-medium">Activeert pallet-reconciliatie, transportkosten en financiële demurrage-berekeningen.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={state.settings?.featureFlags?.enableFinance !== false} 
                        onChange={e => {
                          const currentFlags = state.settings?.featureFlags || { enableFinance: true };
                          dispatch('SAVE_SETTING', { 
                            key: 'feature_flags', 
                            value: { ...currentFlags, enableFinance: e.target.checked } 
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[var(--muted)]/50 rounded-2xl border border-border">
                    <div className="space-y-1">
                      <p className="font-black text-foreground uppercase tracking-tight text-sm">Strategische Cost Control (Demurrage)</p>
                      <p className="text-xs text-[var(--muted-foreground)] font-medium">Activeert de Demurrage Risk Board en het beheer van Vrije Dagen (Free Time) per container.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={state.settings?.featureFlags?.enableCostControl === true} 
                        onChange={e => {
                          const currentFlags = state.settings?.featureFlags || { enableFinance: true };
                          dispatch('SAVE_SETTING', { 
                            key: 'feature_flags', 
                            value: { ...currentFlags, enableCostControl: e.target.checked } 
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="p-4 bg-amber-50/10 border border-amber-500/20 rounded-2xl">
                    <p className="text-xs text-amber-600 font-bold leading-relaxed">
                      LATER: Hier kunnen aanvullende modules zoals "Personeelsplanning" of "Leveranciersportaal" worden toegevoegd zodra deze beschikbaar zijn.
                    </p>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Modal 
        isOpen={!!editingWarehouse} 
        onClose={() => setEditingWarehouse(null)}
        title={editingWarehouse?.id ? 'Magazijn Aanpassen' : 'Nieuw Magazijn'}
      >
        <div className="space-y-6">
          <Input label="Naam" value={editingWarehouse?.name || ''} onChange={e => setEditingWarehouse({...editingWarehouse, name: e.target.value})} />
          <Input label="Adres" value={editingWarehouse?.address || ''} onChange={e => setEditingWarehouse({...editingWarehouse, address: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Openingstijd" type="time" value={editingWarehouse?.openingTime || '07:00'} onChange={e => setEditingWarehouse({...editingWarehouse, openingTime: e.target.value})} />
            <Input label="Sluitingstijd" type="time" value={editingWarehouse?.closingTime || '15:00'} onChange={e => setEditingWarehouse({...editingWarehouse, closingTime: e.target.value})} />
          </div>
          <Input as="textarea" label="Beschrijving" rows={2} value={editingWarehouse?.description || ''} onChange={e => setEditingWarehouse({...editingWarehouse, description: e.target.value})} />
          
          <div className="flex items-center gap-3 p-4 bg-[var(--muted)]/50 rounded-2xl border border-border">
            <input 
              type="checkbox" 
              id="hasGate" 
              checked={!!editingWarehouse?.hasGate} 
              onChange={e => setEditingWarehouse({...editingWarehouse, hasGate: e.target.checked})}
              className="w-5 h-5 rounded-md border-border text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="hasGate" className="text-sm font-bold text-foreground cursor-pointer">
              Heeft dit magazijn een toegangspoort? (Gate-In registratie)
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setEditingWarehouse(null)}>Annuleren</Button>
            <Button className="flex-1" onClick={() => handleSaveWarehouse(editingWarehouse!)}>Opslaan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
