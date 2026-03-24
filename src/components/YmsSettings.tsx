import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Plus, Save, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WarehouseManager } from './features/WarehouseManager';
import { DockManager } from './features/DockManager';
import { WaitingAreaManager } from './features/WaitingAreaManager';
import { Modal } from './shared/Modal';
import { Input } from './shared/Input';
import { Button } from './shared/Button';
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
            <div className="py-20 text-center bg-card rounded-[2.5rem] border border-dashed border-border italic text-[var(--muted-foreground)] font-medium">
               Geavanceerde dagelijkse overrides (beschikbaarheid, capaciteit) zijn momenteel in ontwikkeling.
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
          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setEditingWarehouse(null)}>Annuleren</Button>
            <Button className="flex-1" onClick={() => handleSaveWarehouse(editingWarehouse!)}>Opslaan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
