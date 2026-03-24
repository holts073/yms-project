import React, { useState, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { 
  Package, 
  Search, 
  MapPin, 
  Calendar,
  Truck as TruckIcon,
  ChevronRight,
  Download
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDeliveries } from '../hooks/useDeliveries';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Archive = () => {
  const { state } = useSocket();
  const { addressBook } = state || {};
  const { deliveries = [] } = useDeliveries(1, 1000, '', 'all', 'updatedAt', false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter for ONLY delivered items
  const deliveredList = useMemo(() => {
    return deliveries
      .filter((d) => d.status === 100)
      .filter((d) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const supplierName = addressBook?.suppliers.find(s => s.id === d.supplierId)?.name.toLowerCase() || '';
        return (
          d.reference.toLowerCase().includes(term) ||
          supplierName.includes(term) ||
          (d.containerNumber && d.containerNumber.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [deliveries, searchTerm, addressBook]);

  const handleExportCSV = () => {
    const headers = [
      'Referentie', 'Type', 'Leverancier', 'Status', 'ETA Magazijn', 'Aantal Pallets'
    ].join(',');

    const rows = deliveredList.map(d => {
      const supplierName = addressBook?.suppliers.find(s => s.id === d.supplierId)?.name || 'Onbekend';
      return [
        `"${d.reference}"`,
        `"${d.type}"`,
        `"${supplierName}"`,
        `"Afgeleverd"`,
        `"${d.etaWarehouse}"`,
        `"${d.palletCount}"`
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `archief_leveringen_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Archief</h2>
          <p className="text-[var(--muted-foreground)] mt-1">Overzicht van alle succesvol afgeleverde zendingen.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
            <input 
              type="text" 
              placeholder="Zoek in afgeronde zendingen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--muted)] border border-border rounded-full text-sm focus:ring-2 focus:ring-indigo-500 shadow-inner transition-all text-foreground placeholder:text-[var(--muted-foreground)]"
            />
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--muted)] border border-border text-foreground font-bold rounded-full hover:bg-[var(--muted)]/80 transition-colors shadow-sm"
          >
            <Download size={18} />
            CSV Export
          </button>
        </div>
      </header>

      <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--muted)]/50 border-b border-border">
              <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Referentie</th>
              <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Leverancier</th>
              <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Datum Afgeleverd</th>
              <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deliveredList.map((delivery) => {
              const supplier = addressBook?.suppliers.find(s => s.id === delivery.supplierId);
              return (
                <tr key={delivery.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner",
                        delivery.type === 'container' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                      )}>
                        {delivery.type === 'container' ? <Package size={20} /> : <TruckIcon size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{delivery.reference}</p>
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mt-0.5">{delivery.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-foreground">
                        {supplier?.name || "Onbekend"}
                      </span>
                      {delivery.loadingCountry && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                          <MapPin size={12} />
                          {delivery.loadingCity ? `${delivery.loadingCity}, ` : ''}{delivery.loadingCountry}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] font-medium">
                      <Calendar size={16} className="text-[var(--muted-foreground)]" />
                      {new Date(delivery.updatedAt).toLocaleDateString('nl-NL')}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-[var(--muted-foreground)] space-y-1">
                      {delivery.containerNumber && <p>Container: <strong className="text-foreground">{delivery.containerNumber}</strong></p>}
                      <p>Pallets: <strong className="text-foreground">{delivery.palletCount}</strong></p>
                    </div>
                  </td>
                </tr>
              );
            })}
            {deliveredList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-[var(--muted-foreground)]">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Geen afgeleverde zendingen gevonden.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Archive;
