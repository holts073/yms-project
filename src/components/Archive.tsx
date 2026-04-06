import React, { useState, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { Package, Search, Calendar, Truck as TruckIcon, Download, Clock, History, FileText } from 'lucide-react';
import { useDeliveries } from '../hooks/useDeliveries';
import { Button } from './shared/Button';
import { Badge } from './shared/Badge';
import { Delivery } from '../types';
import { cn } from '../lib/utils';
import { AuditLogModal } from './features/AuditLogModal';

const Archive = () => {
  const { state } = useSocket();
  const { addressBook } = state || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'container' | 'exworks'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  
  const { deliveries = [] } = useDeliveries(1, 1000, '', 'all', 'updatedAt', false);

  const filteredList = useMemo(() => {
    return deliveries
      .filter((d: Delivery) => d.status === 100 || (d as any).status === 'COMPLETED' || (d as any).status === 'GATE_OUT')
      .filter((d: Delivery) => {
        const matchesTerm = !searchTerm ? true : (
          String(d.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          addressBook?.suppliers.find((s: any) => s.id === d.supplierId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.containerNumber || (d as any).licensePlate || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const matchesDate = !selectedDate ? true : (
          d.updatedAt.startsWith(selectedDate)
        );

        const matchesType = typeFilter === 'all' ? true : d.type === typeFilter;
        const matchesSupplier = supplierFilter === 'all' ? true : d.supplierId === supplierFilter;
        
        return matchesTerm && matchesDate && matchesType && matchesSupplier;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [deliveries, searchTerm, selectedDate, typeFilter, supplierFilter, addressBook]);

  // Handle page reset on filter change
  useMemo(() => {
    setCurrentPage(1);
    return null;
  }, [searchTerm, selectedDate, typeFilter, supplierFilter]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const suppliers = useMemo(() => {
    if (!addressBook?.suppliers) return [];
    return [...addressBook.suppliers].sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [addressBook]);

  const handleExportCSV = () => {
    const headers = ['Referentie', 'Kenteken/Container', 'Leverancier', 'Datum', 'Lead Time'].join(',');
    const rows = filteredList.map((d: Delivery) => {
      const supplierName = addressBook?.suppliers.find((s: any) => s.id === d.supplierId)?.name || 'Onbekend';
      const date = new Date(d.updatedAt).toLocaleDateString('nl-NL');
      return [
        `"${d.reference}"`,
        `"${d.containerNumber || (d as any).licensePlate || ''}"`,
        `"${supplierName}"`,
        `"${date}"`,
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
            <History className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight italic uppercase">Archief & Historie</h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium text-sm">Doorzoek alle voltooide logistieke bewegingen.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
             <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="pl-12 pr-4 py-4 bg-card border border-border rounded-3xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 shadow-sm text-foreground outline-none"
             />
          </div>
          <Button variant="secondary" onClick={handleExportCSV} leftIcon={<Download size={18} />}>
            Export
          </Button>
        </div>
      </header>

      <div className="bg-card border border-border p-4 rounded-3xl flex flex-col lg:flex-row items-center gap-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
          <input 
            type="text" 
            placeholder="Zoek op referentie, leverancier of kenteken..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[var(--muted)]/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 text-foreground outline-none font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-4 bg-[var(--muted)]/50 border-none rounded-2xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Alle Types</option>
            <option value="container">Containers</option>
            <option value="exworks">Ex-Works</option>
          </select>

          <select 
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-4 py-4 bg-[var(--muted)]/50 border-none rounded-2xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-indigo-500 max-w-[200px]"
          >
            <option value="all">Alle Leveranciers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {(searchTerm || selectedDate || typeFilter !== 'all' || supplierFilter !== 'all') && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                setSearchTerm('');
                setSelectedDate('');
                setTypeFilter('all');
                setSupplierFilter('all');
              }}
              className="rounded-2xl h-[52px]"
            >
              Wis Alles
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--muted)]/50 border-b border-border">
                <th className="p-3 text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Referentie</th>
                <th className="p-3 text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Vracht</th>
                <th className="p-3 text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Leverancier</th>
                <th className="p-3 text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)] text-center">Voltooid op</th>
                <th className="p-3 text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)] text-right">Historie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-[var(--muted-foreground)] font-bold italic">
                    Geen resultaten gevonden voor deze selectie.
                  </td>
                </tr>
              ) : (
                paginatedList.map((d: Delivery) => {
                  const supplier = addressBook?.suppliers.find((s: any) => s.id === d.supplierId);
                  return (
                    <tr key={d.id} className="hover:bg-[var(--muted)]/20 transition-colors group">
                      <td className="p-3 px-6">
                        <div className="flex items-center gap-3">
                           <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              d.type === 'container' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                           )}>
                              {d.type === 'container' ? <Package size={16} /> : <TruckIcon size={16} />}
                           </div>
                           <span 
                             onClick={() => setSelectedDelivery(d)}
                             className="font-black text-foreground text-sm uppercase tracking-tight hover:text-indigo-600 cursor-pointer transition-colors"
                           >
                             {d.reference}
                           </span>
                        </div>
                      </td>
                      <td className="p-3 px-6">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {d.containerNumber || (d as any).licensePlate || '-'}
                            </span>
                            {d.billOfLading && (
                              <span className="text-[9px] text-[var(--muted-foreground)] font-bold italic">B/L: {d.billOfLading}</span>
                            )}
                         </div>
                      </td>
                      <td className="p-3 px-6 text-[11px] font-bold text-[var(--muted-foreground)]">
                        {supplier?.name || 'Onbekend'}
                      </td>
                      <td className="p-3 px-6 text-center">
                        <div className="flex flex-col items-center">
                           <span className="text-xs font-black text-foreground">{new Date(d.updatedAt).toLocaleDateString('nl-NL')}</span>
                           <span className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase tracking-tighter">
                             {new Date(d.updatedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                      </td>
                      <td className="p-3 px-6 text-right">
                         <button 
                           onClick={() => setSelectedDelivery(d)}
                           className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                         >
                           <FileText size={12} /> Logboek
                         </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 bg-[var(--muted)]/30 border-t border-border">
            <div className="text-xs font-bold text-[var(--muted-foreground)]">
              Pagina <span className="text-foreground">{currentPage}</span> van <span className="text-foreground">{totalPages}</span> 
              <span className="mx-2 opacity-30">|</span> 
              Totaal <span className="text-foreground">{filteredList.length}</span> resultaten
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Vorige
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum + 2 > totalPages) pageNum = totalPages - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-xs font-black transition-all",
                        currentPage === pageNum 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                          : "bg-card border border-border text-[var(--muted-foreground)] hover:border-indigo-500"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Volgende
              </Button>
            </div>
          </div>
        )}
      </div>

      <AuditLogModal 
        isOpen={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        delivery={selectedDelivery}
      />
    </div>
  );
};

export default Archive;
