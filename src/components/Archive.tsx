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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Archive = () => {
  const { state } = useSocket();
  const { deliveries = [], addressBook } = state || {};
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
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Archief</h2>
          <p className="text-slate-500 mt-1">Overzicht van alle succesvol afgeleverde zendingen.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Zoek in afgeronde zendingen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
            />
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={18} />
            CSV Export
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Referentie</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Leverancier</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Datum Afgeleverd</th>
              <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deliveredList.map((delivery) => {
              const supplier = addressBook?.suppliers.find(s => s.id === delivery.supplierId);
              return (
                <tr key={delivery.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner",
                        delivery.type === 'container' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                      )}>
                        {delivery.type === 'container' ? <Package size={20} /> : <TruckIcon size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{delivery.reference}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{delivery.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-900">
                        {supplier?.name || "Onbekend"}
                      </span>
                      {delivery.loadingCountry && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin size={12} />
                          {delivery.loadingCity ? `${delivery.loadingCity}, ` : ''}{delivery.loadingCountry}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <Calendar size={16} className="text-slate-400" />
                      {new Date(delivery.updatedAt).toLocaleDateString('nl-NL')}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm text-slate-600 space-y-1">
                      {delivery.containerNumber && <p>Container: <strong>{delivery.containerNumber}</strong></p>}
                      <p>Pallets: <strong>{delivery.palletCount}</strong></p>
                    </div>
                  </td>
                </tr>
              );
            })}
            {deliveredList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-slate-400">
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
