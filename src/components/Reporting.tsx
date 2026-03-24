import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Download, Search, BarChart3, FileSpreadsheet } from 'lucide-react';
import { useReportingData } from '../hooks/useReportingData';
import { Table } from './shared/Table';
import { Button } from './shared/Button';
import { cn } from '../lib/utils';

const Reporting = () => {
  const { currentUser } = useSocket();
  const [reportType, setReportType] = useState<'volume' | 'costs'>('volume');
  const [searchTerm, setSearchTerm] = useState('');
  const { reportData, isLoading } = useReportingData(searchTerm);

  const exportToCSV = () => {
    const headers = reportType === 'volume' 
      ? ['Leverancier', 'Aantal Leveringen', 'Totaal Pallets', 'Totaal Gewicht (kg)']
      : ['Leverancier', 'Aantal Leveringen', 'Totaal Kosten (€)', 'Gem. Kosten per Pallet (€)'];
    
    const rows = reportData.map(d => reportType === 'volume' 
      ? [d.name, d.count, d.pallets, d.weight]
      : [d.name, d.count, d.costs.toFixed(2), d.avgCostPerPallet]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `ILG_Rapport_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const columns = [
    {
      header: 'Leverancier',
      accessor: (row: any) => <span className="font-bold text-foreground">{row.name}</span>
    },
    {
      header: 'Zendingen',
      accessor: 'count' as any,
      className: 'text-center'
    },
    ...(reportType === 'volume' ? [
      {
        header: 'Totaal Pallets',
        accessor: 'pallets' as any,
        className: 'text-right font-mono text-[var(--muted-foreground)]'
      },
      {
        header: 'Gewicht (kg)',
        accessor: (row: any) => row.weight.toLocaleString(),
        className: 'text-right font-mono text-[var(--muted-foreground)]'
      }
    ] : [
      {
        header: 'Totaal Kosten',
        accessor: (row: any) => <span className="text-indigo-600 dark:text-indigo-400 font-bold">€ {row.costs.toLocaleString()}</span>,
        className: 'text-right font-mono'
      },
      {
        header: 'Gem. / Pallet',
        accessor: (row: any) => `€ ${row.avgCostPerPallet}`,
        className: 'text-right font-mono text-[var(--muted-foreground)]'
      }
    ])
  ];

  if (currentUser?.role === 'staff') {
    return (
      <div className="py-20 text-center animate-in fade-in duration-500">
        <h2 className="text-2xl font-black text-foreground">Toegang Geweigerd</h2>
        <p className="text-[var(--muted-foreground)] mt-2 font-medium">Je hebt geen rechten om deze rapportages te bekijken.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <FileSpreadsheet className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight italic uppercase">Rapportages</h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium tracking-widest uppercase text-xs">Analyseer prestaties en exporteer data voor administratie.</p>
          </div>
        </div>
        <Button onClick={exportToCSV} leftIcon={<Download size={20} />}>
          Exporteer CSV
        </Button>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-2 p-1.5 bg-card rounded-3xl border border-border w-fit shadow-sm">
          <button 
            onClick={() => setReportType('volume')}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all",
              reportType === 'volume' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20" : "text-[var(--muted-foreground)] hover:text-foreground"
            )}
          >
            <BarChart3 size={18} /> Volume
          </button>
          <button 
            onClick={() => setReportType('costs')}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all",
              reportType === 'costs' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20" : "text-[var(--muted-foreground)] hover:text-foreground"
            )}
          >
            <BarChart3 size={18} /> Kosten
          </button>
        </div>

        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
          <input 
            type="text" 
            placeholder="Zoek leverancier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm text-foreground outline-none"
          />
        </div>
      </div>

      <Table 
        data={reportData}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="Geen rapportagegegevens gevonden voor deze selectie."
      />
    </div>
  );
};

export default Reporting;
