import React, { useState, useMemo } from 'react';
import { BadgeEuro, CheckCircle2, History, TrendingDown, TrendingUp, Wallet, Filter, Search } from 'lucide-react';
import { useAddressBook } from '../../hooks/useAddressBook';
import { useSocket } from '../../SocketContext';
import { Button } from '../shared/Button';
import { PalletLedger } from './PalletLedger';
import { AddressEntry } from '../../types';
import { cn } from '../../lib/utils';

export const Reconciliation: React.FC = () => {
  const { state } = useSocket();
  const { suppliers, transporters, customers } = useAddressBook();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'supplier' | 'transporter' | 'customer'>('all');

  const allEntities = useMemo(() => {
    return [...suppliers, ...transporters, ...customers];
  }, [suppliers, transporters, customers]);

  const filteredEntities = useMemo(() => {
    return allEntities.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           e.contact.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || e.type === filterType;
      const hasBalance = (state?.palletBalances?.[e.id] || 0) !== 0;
      return matchesSearch && matchesType && hasBalance;
    }).sort((a, b) => {
      const balA = Math.abs(state?.palletBalances?.[a.id] || 0);
      const balB = Math.abs(state?.palletBalances?.[b.id] || 0);
      return balB - balA; // Order by highest absolute balance
    });
  }, [allEntities, searchTerm, filterType, state?.palletBalances]);

  const selectedEntity = useMemo(() => {
    return allEntities.find(e => e.id === selectedEntityId) || null;
  }, [allEntities, selectedEntityId]);

  const selectedTransactions = useMemo(() => {
    if (!selectedEntityId || !state?.palletTransactions) return [];
    return state.palletTransactions.filter(t => t.entityId === selectedEntityId);
  }, [state?.palletTransactions, selectedEntityId]);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
            <BadgeEuro className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight italic uppercase">Reconciliatie</h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium tracking-widest uppercase text-xs">Beheer pallet-saldi en verreken creditnota's.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Entity List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
              <input 
                type="text" 
                placeholder="Zoek entiteit..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               {['all', 'supplier', 'transporter', 'customer'].map((t) => (
                 <button
                   key={t}
                   onClick={() => setFilterType(t as any)}
                   className={cn(
                     "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                     filterType === t 
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20" 
                      : "bg-muted/50 text-[var(--muted-foreground)] border-border hover:border-emerald-500/50"
                   )}
                 >
                   {t === 'all' ? 'Alle' : t === 'supplier' ? 'Lev.' : t === 'transporter' ? 'Trans.' : 'Klant'}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
              <h3 className="font-black italic uppercase tracking-widest text-[10px] text-foreground">Openstaande Balansen</h3>
              <Filter size={14} className="text-[var(--muted-foreground)]" />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {filteredEntities.length === 0 ? (
                <div className="p-12 text-center opacity-40 italic font-medium uppercase text-[10px] tracking-widest">
                  Geen resultaten gevonden met een openstaand saldo.
                </div>
              ) : (
                filteredEntities.map((entity) => {
                  const balance = state?.palletBalances?.[entity.id] || 0;
                  const isActive = selectedEntityId === entity.id;
                  
                  return (
                    <button
                      key={entity.id}
                      onClick={() => setSelectedEntityId(entity.id)}
                      className={cn(
                        "w-full px-6 py-4 text-left transition-all hover:bg-muted/30 group relative",
                        isActive && "bg-emerald-600/5 border-l-4 border-l-emerald-600"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-black text-foreground tracking-tight group-hover:text-emerald-500 transition-colors uppercase italic truncate max-w-[180px]">
                          {entity.name}
                        </span>
                        <span className={cn(
                          "text-xs font-black italic tracking-tighter",
                          balance >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {balance > 0 ? `+${balance}` : balance}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] opacity-70">
                        <span>{entity.type === 'supplier' ? 'Leverancier' : entity.type === 'transporter' ? 'Transporteur' : 'Klant'}</span>
                        <span>€ {((balance) * (entity.pallet_rate || 0)).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Content: Details & Ledger */}
        <div className="lg:col-span-8 space-y-8">
           {selectedEntityId ? (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-3xl bg-emerald-600/5 flex items-center justify-center border border-emerald-500/20 text-emerald-600 font-black text-3xl italic">
                       {selectedEntity?.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-foreground italic uppercase tracking-tight leading-none mb-1">
                        {selectedEntity?.name}
                      </h3>
                      <div className="flex gap-3 items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 px-2 py-0.5 bg-emerald-600/10 rounded-lg">
                          {selectedEntity?.type === 'supplier' ? 'Leverancier' : selectedEntity?.type === 'transporter' ? 'Transporteur' : 'Klant'}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-tight italic opacity-60">
                          {selectedEntity?.contact} • {selectedEntity?.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="secondary" className="flex-1 sm:flex-none">Download Ledger</Button>
                    <Button variant="primary" className="flex-1 sm:flex-none" leftIcon={<CheckCircle2 size={18} />}>Verrekenen</Button>
                  </div>
                </div>

                <PalletLedger 
                  transactions={selectedTransactions} 
                  entity={selectedEntity as AddressEntry}
                />
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center py-24 text-center bg-card/50 rounded-3xl border border-dashed border-border p-12">
               <div className="bg-muted/30 p-8 rounded-full mb-8 relative">
                 <BadgeEuro size={64} className="text-[var(--muted-foreground)] opacity-20" />
                 <TrendingUp size={24} className="text-emerald-500 absolute top-4 right-4 opacity-40 animate-pulse" />
                 <TrendingDown size={24} className="text-rose-500 absolute bottom-4 left-4 opacity-40 animate-pulse delay-700" />
               </div>
               <h3 className="text-2xl font-black text-foreground italic uppercase tracking-widest mb-4">Gekozen voor Reconciliatie</h3>
               <p className="text-[var(--muted-foreground)] max-w-sm mb-8 font-medium italic opacity-70">
                 Selecteer een partij aan de linkerkant om de openstaande balans te analyseren, de transactiegeschiedenis in te zien en creditnota's te koppelen.
               </p>
               <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 text-left">
                     <p className="text-[9px] font-black uppercase text-emerald-500 tracking-widest mb-1">Inbound Verplichting</p>
                     <p className="text-xs font-bold text-foreground opacity-60 italic">Pallets meegebracht door leveranciers/transporteurs bij lossen.</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 text-left">
                     <p className="text-[9px] font-black uppercase text-rose-500 tracking-widest mb-1">Outbound Tegoed</p>
                     <p className="text-xs font-bold text-foreground opacity-60 italic">Pallets verzonden naar klanten of meegegeven aan transporteurs.</p>
                  </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
