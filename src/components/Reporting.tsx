import React, { useState, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { 
  FileText, 
  Download, 
  Search, 
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon
} from 'lucide-react';
import { useDeliveries } from '../hooks/useDeliveries';

const Reporting = () => {
  const { state, currentUser } = useSocket();
  const { addressBook } = state || {};
  const { deliveries } = useDeliveries(1, 1000, '', 'all', 'eta', false);
  
  const [reportType, setReportType] = useState<'volume' | 'costs'>('volume');
  const [searchFilter, setSearchFilter] = useState('');

  const reportData = useMemo(() => {
    if (!addressBook?.suppliers) return [];

    const stats = addressBook.suppliers.map(supplier => {
      const supplierDeliveries = deliveries.filter(d => d.supplierId === supplier.id);
      
      const totalPallets = supplierDeliveries.reduce((sum, d) => sum + (d.palletCount || 0), 0);
      const totalWeight = supplierDeliveries.reduce((sum, d) => sum + (d.weight || 0), 0);
      const totalCost = supplierDeliveries.reduce((sum, d) => sum + (d.transportCost || 0), 0);
      
      return {
        id: supplier.id,
        name: supplier.name,
        count: supplierDeliveries.length,
        pallets: totalPallets,
        weight: totalWeight,
        costs: totalCost,
        avgCostPerPallet: totalPallets > 0 ? (totalCost / totalPallets).toFixed(2) : '0.00'
      };
    });

    return stats.filter(s => s.name.toLowerCase().includes(searchFilter.toLowerCase()));
  }, [deliveries, addressBook?.suppliers, searchFilter]);

  const exportToCSV = () => {
    let headers = [];
    let rows = [];

    if (reportType === 'volume') {
      headers = ['Leverancier', 'Aantal Leveringen', 'Totaal Pallets', 'Totaal Gewicht (kg)'];
      rows = reportData.map(d => [d.name, d.count, d.pallets, d.weight]);
    } else {
      headers = ['Leverancier', 'Aantal Leveringen', 'Totaal Kosten (€)', 'Gem. Kosten per Pallet (€)'];
      rows = reportData.map(d => [d.name, d.count, d.costs.toFixed(2), d.avgCostPerPallet]);
    }

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ilg_rapport_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (currentUser?.role === 'staff') {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-bold text-foreground">Toegang Geweigerd</h2>
        <p className="text-[var(--muted-foreground)] mt-2">Je hebt geen rechten om deze pagina te bekijken.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Rapportages</h2>
          <p className="text-[var(--muted-foreground)] mt-1">Analyseer prestaties en exporteer data voor administratie.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
        >
          <Download size={20} />
          Exporteer CSV
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex gap-2 p-1 bg-[var(--muted)]/50 rounded-2xl w-fit border border-border">
          <button 
            onClick={() => setReportType('volume')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${reportType === 'volume' ? 'bg-card text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-[var(--muted-foreground)] hover:text-foreground'}`}
          >
            <BarChart3 size={18} />
            Volume Rapport
          </button>
          <button 
            onClick={() => setReportType('costs')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${reportType === 'costs' ? 'bg-card text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-[var(--muted-foreground)] hover:text-foreground'}`}
          >
            <BarChart3 size={18} />
            Kosten Rapport
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
          <input 
            type="text" 
            placeholder="Zoek leverancier..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-[var(--muted)] border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-foreground placeholder:text-[var(--muted-foreground)] shadow-inner"
          />
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden text-left">
        <table className="w-full">
          <thead className="bg-[var(--muted)]/50 border-b border-border">
            <tr>
              <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Leverancier</th>
              <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Zendingen</th>
              {reportType === 'volume' ? (
                <>
                  <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-right">Totaal Pallets</th>
                  <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-right">Gewicht (kg)</th>
                </>
              ) : (
                <>
                  <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-right">Totaal Kosten</th>
                  <th className="px-8 py-5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-right">Gem. / Pallet</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reportData.map((row) => (
              <tr key={row.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                <td className="px-8 py-6">
                  <span className="text-sm font-bold text-foreground">{row.name}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className="text-sm font-medium text-[var(--muted-foreground)]">{row.count}</span>
                </td>
                {reportType === 'volume' ? (
                  <>
                    <td className="px-8 py-6 text-right font-mono text-sm text-[var(--muted-foreground)]">{row.pallets}</td>
                    <td className="px-8 py-6 text-right font-mono text-sm text-[var(--muted-foreground)]">{row.weight.toLocaleString()}</td>
                  </>
                ) : (
                  <>
                    <td className="px-8 py-6 text-right font-mono text-sm text-indigo-600 dark:text-indigo-400 font-bold">€ {row.costs.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right font-mono text-sm text-[var(--muted-foreground)]">€ {row.avgCostPerPallet}</td>
                  </>
                )}
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-[var(--muted-foreground)] font-medium">
                  Geen gegevens gevonden voor deze filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reporting;
