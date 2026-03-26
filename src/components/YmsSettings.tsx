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
import { Badge } from './shared/Badge';
import { YmsWarehouse } from '../types';

export default function YmsSettings() {
  const { state, dispatch } = useSocket();
  const [activeTab, setActiveTab] = useState<'warehouses' | 'docks' | 'waitingAreas' | 'overrides'>('warehouses');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('W01');
  const [editingWarehouse, setEditingWarehouse] = useState<Partial<YmsWarehouse> | null>(null);
  
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
        <div className="flex gap-2 p-1.5 bg-card border border-border rounded-3xl w-fit shadow-sm">
          {['warehouses', 'docks', 'waitingAreas', 'overrides'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' 
                  : 'text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--muted)]/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
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
          <Input as="textarea" label="Beschrijving" rows={3} value={editingWarehouse?.description || ''} onChange={e => setEditingWarehouse({...editingWarehouse, description: e.target.value})} />
          
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
