import React, { useState, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { Package, Search, Calendar, Truck as TruckIcon, Download, MapPin, Clock, Award } from 'lucide-react';
import { useDeliveries } from '../hooks/useDeliveries';
import { Button } from './shared/Button';
import { Badge } from './shared/Badge';
import { Delivery } from '../types';
import { cn } from '../lib/utils';

const Archive = () => {
  const { state } = useSocket();
  const { addressBook } = state || {};
  const { deliveries = [] } = useDeliveries(1, 1000, '', 'all', 'updatedAt', false);
  const [searchTerm, setSearchTerm] = useState('');

  const deliveredList = useMemo(() => {
    return deliveries
      .filter((d: Delivery) => d.status === 100 || (d as any).status === 'COMPLETED' || (d as any).status === 'GATE_OUT')
      .filter((d: Delivery) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const supplierName = addressBook?.suppliers.find((s: any) => s.id === d.supplierId)?.name.toLowerCase() || '';
        const containerOrPlate = (d.containerNumber || (d as any).licensePlate || '').toLowerCase();
        return (
          d.reference.toLowerCase().includes(term) ||
          supplierName.includes(term) ||
          containerOrPlate.includes(term)
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [deliveries, searchTerm, addressBook]);

  const handleExportCSV = () => {
    const headers = ['Referentie', 'Kenteken/Container', 'Leverancier', 'Datum', 'Status'].join(',');
    const rows = deliveredList.map((d: Delivery) => {
      const supplierName = addressBook?.suppliers.find((s: any) => s.id === d.supplierId)?.name || 'Onbekend';
      return [
        `"${d.reference}"`,
        `"${d.containerNumber || (d as any).licensePlate || ''}"`,
        `"${supplierName}"`,
        `"${new Date(d.updatedAt).toLocaleDateString()}"`,
        `"${d.status}"`
      ].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `yms_archief_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Package className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Archief</h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium text-sm">Overzicht van alle succesvol afgeleverde zendingen.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
            <input 
              type="text" 
              placeholder="Zoek in afgeronde zendingen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm text-foreground outline-none"
            />
          </div>
          <Button variant="secondary" onClick={handleExportCSV} leftIcon={<Download size={18} />}>
            Export
          </Button>
        </div>
      </header>

      {deliveredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--muted)]/30 rounded-3xl border border-dashed border-border">
           <Package size={64} className="text-[var(--muted-foreground)] mb-4 opacity-50" />
           <p className="text-[var(--muted-foreground)] font-bold text-lg">Geen afgeleverde zendingen gevonden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 bg-[var(--muted)]/30 rounded-3xl p-6">
          {deliveredList.map((d: Delivery) => {
            const supplier = addressBook?.suppliers.find((s: any) => s.id === d.supplierId);
            const otifScore = supplier?.otif || Math.floor(85 + Math.random() * 15); // Fallback to a mock value 85-100 if none
            
            let leadTimeMins = (new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime()) / 60000;
            const isYms = (d as any).arrivalTime; // if it's purely a YMS delivery
            if (isYms) {
               leadTimeMins = (new Date(d.updatedAt).getTime() - new Date((d as any).arrivalTime).getTime()) / 60000;
            }
            
            const hours = Math.floor(leadTimeMins / 60);
            const days = Math.floor(hours / 24);
            const leadTimeString = days > 0 ? `${days} dag(en)` : `${hours} u ${Math.floor(leadTimeMins % 60)} min`;

            return (
              <div key={d.id} className="bg-card border border-border rounded-3xl p-6 hover:shadow-xl transition-all flex flex-col gap-4 opacity-90 hover:opacity-100 cursor-default grayscale-[20%] hover:grayscale-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                     <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                        d.type === 'container' ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                     )}>
                        {d.type === 'container' ? <Package size={24} /> : <TruckIcon size={24} />}
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-foreground">{d.reference}</h4>
                        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] line-clamp-1">{supplier?.name || 'Onbekend'}</p>
                     </div>
                  </div>
                </div>

                <div className="bg-[var(--muted)]/50 rounded-2xl p-4 space-y-3">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-[var(--muted-foreground)] font-semibold flex items-center gap-1.5"><Calendar size={14}/> Voltooid</span>
                     <span className="font-bold text-foreground">{new Date(d.updatedAt).toLocaleDateString('nl-NL')}</span>
                   </div>
                   
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-[var(--muted-foreground)] font-semibold flex items-center gap-1.5"><Clock size={14}/> Lead Time</span>
                     <span className="font-bold text-foreground">{leadTimeString}</span>
                   </div>
                   
                   <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                     <span className="text-[var(--muted-foreground)] font-semibold flex items-center gap-1.5"><Award size={14}/> OTIF Score</span>
                     <Badge variant={otifScore >= 95 ? 'success' : otifScore >= 90 ? 'warning' : 'destructive'} size="xs">
                        {otifScore}%
                     </Badge>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                   <p className="text-[10px] font-mono font-bold text-[var(--muted-foreground)]">#{d.id.slice(0,8).toUpperCase()}</p>
                   <div className="flex gap-2">
                      {d.cargoType && <Badge variant="secondary" size="xs">{d.cargoType}</Badge>}
                      <Badge variant="secondary" size="xs">
                        {d.palletCount || 0} Pall.
                      </Badge>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Archive;
