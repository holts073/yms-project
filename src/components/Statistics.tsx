import React from 'react';
import { useSocket } from '../SocketContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { TrendingUp, Award, AlertTriangle, Clock, Target, DollarSign, Package } from 'lucide-react';
import { clsx as cn } from 'clsx';

const Statistics = () => {
  const { state } = useSocket();
  const { deliveries = [], addressBook } = state || {};

  // Reliability per Supplier
  const supplierStats = addressBook?.suppliers.map(supplier => {
    const supplierDeliveries = deliveries.filter(d => d.supplierId === supplier.id);
    let totalDocs = 0;
    let receivedDocs = 0;
    supplierDeliveries.forEach(d => {
      d.documents.forEach(doc => {
        if (doc.required) {
          totalDocs++;
          if (doc.status === 'received') receivedDocs++;
        }
      });
    });
    const reliability = totalDocs > 0 ? Math.round((receivedDocs / totalDocs) * 100) : 100;
    return { name: supplier.name, reliability, deliveries: supplierDeliveries.length };
  }).sort((a, b) => b.reliability - a.reliability).slice(0, 5) || [];

  const typeData = [
    { name: 'Container', value: deliveries.filter(d => d.type === 'container').length },
    { name: 'Ex-Works', value: deliveries.filter(d => d.type === 'exworks').length },
  ];

  const COLORS = ['#4f46e5', '#f97316'];

  // Advanced Metrics
  const completedDeliveries = deliveries.filter(d => d.status === 100);

  // OTIF Calculation
  const onTimeDeliveries = completedDeliveries.filter(d => {
    if (!d.etaWarehouse) return false;
    const updatedDate = new Date(d.updatedAt);
    updatedDate.setHours(0,0,0,0);
    const etaDate = new Date(d.etaWarehouse);
    etaDate.setHours(0,0,0,0);
    return updatedDate <= etaDate;
  });
  const otif = completedDeliveries.length > 0 ? Math.round((onTimeDeliveries.length / completedDeliveries.length) * 100) : 0;

  // Lead Time Calculation
  let totalLeadTimeDays = 0;
  completedDeliveries.forEach(d => {
    const createdDate = new Date(d.createdAt);
    const updatedDate = new Date(d.updatedAt);
    const diffTime = Math.abs(updatedDate.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalLeadTimeDays += diffDays;
  });
  const avgLeadTime = completedDeliveries.length > 0 ? Math.round(totalLeadTimeDays / completedDeliveries.length) : 0;

  const totalCostContainer = deliveries.filter(d => d.type === 'container').reduce((sum, d) => sum + (d.transportCost || 0), 0);
  const totalCostExWorks = deliveries.filter(d => d.type === 'exworks').reduce((sum, d) => sum + (d.transportCost || 0), 0);
  const totalCost = totalCostContainer + totalCostExWorks;

  // Cost per Pallet Calculation
  const totalPallets = deliveries.reduce((sum, d) => sum + (d.palletCount || 0), 0);
  const avgCostPerPallet = totalPallets > 0 ? Math.round(totalCost / totalPallets) : 0;

  const costData = [
    { name: 'Container', value: totalCostContainer },
    { name: 'Ex-Works', value: totalCostExWorks }
  ];

  // Currency Formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  // Supplier Costs
  const supplierCostStats = addressBook?.suppliers.map(supplier => {
    const supplierDeliveries = deliveries.filter(d => d.supplierId === supplier.id);
    const supplierTotalCost = supplierDeliveries.reduce((sum, d) => sum + (d.transportCost || 0), 0);
    return { name: supplier.name, cost: supplierTotalCost };
  }).sort((a, b) => b.cost - a.cost).slice(0, 5).filter(s => s.cost > 0) || [];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Supply Chain Dashboard</h2>
        <p className="text-slate-500 mt-1">Inzicht in prestaties, kosten en doorlooptijden van al je leveringen.</p>
      </header>

      {/* Warning Banners */}
      {supplierStats.some(s => s.reliability < 80) && (
        <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 flex items-start gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-orange-900 font-bold text-lg mb-1">Aandacht Vereist: Lage OTIF Score</h3>
            <p className="text-orange-800/80 mb-3">
              Een of meerdere leveranciers presteren momenteel onder de norm van 80% betrouwbaarheid.
            </p>
            <div className="flex flex-wrap gap-2">
              {supplierStats.filter(s => s.reliability < 80).map(s => (
                <span key={s.name} className="px-3 py-1 bg-white/60 text-orange-900 text-sm font-medium rounded-full">
                  {s.name} ({s.reliability}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Gem. Lead Time</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Clock size={20} /></div>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-900">{avgLeadTime}</span>
            <span className="text-slate-500 font-medium ml-2">dagen</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">OTIF Score</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Target size={20} /></div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-slate-900">{otif}%</span>
            <span className="text-emerald-500 font-bold text-sm mb-1 uppercase tracking-widest">{onTimeDeliveries.length} / {completedDeliveries.length}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Gem. Kosten per Pallet</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><DollarSign size={20} /></div>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-900">{formatCurrency(avgCostPerPallet)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Actieve Zendingen</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Package size={20} /></div>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-900">{deliveries.filter(d => d.status < 100).length}</span>
            <span className="text-slate-500 font-medium ml-2">stuks</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-6">
          <h3 className="text-xl font-bold text-slate-900 w-full text-left">Type Verdeling (Aantallen)</h3>
          {typeData.reduce((a, b) => a + b.value, 0) > 0 ? (
            <>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-8">
                {typeData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm font-bold text-slate-600">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400 font-medium">Nog onvoldoende data beschikbaar.</div>
          )}
        </div>

        {/* Cost Distribution Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-6">
          <h3 className="text-xl font-bold text-slate-900 w-full text-left">Kosten Verdeling</h3>
          {totalCost > 0 ? (
            <>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={costData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-8">
                {costData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm font-bold text-slate-600">{entry.name}: {formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
             <div className="h-[250px] flex items-center justify-center text-slate-400 font-medium">Nog onvoldoende data beschikbaar.</div>
          )}
        </div>
      </div>

       {/* Reliability Chart */}
       <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Betrouwbaarheid per Leverancier (%)</h3>
              <p className="text-slate-500 text-sm mt-1">Gebaseerd op de vereiste documentatiescore.</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {supplierStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    width={150}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="reliability" radius={[0, 20, 20, 0]} barSize={24}>
                    {supplierStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.reliability > 80 ? '#10b981' : entry.reliability > 50 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">Nog onvoldoende data beschikbaar.</div>
            )}
          </div>
        </div>

        {/* Supplier Cost Chart */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Transportkosten per Leverancier</h3>
              <p className="text-slate-500 text-sm mt-1">Top 5 leveranciers met de hoogste transportkosten (gebaseerd op goedgekeurde leveringen).</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {supplierCostStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierCostStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    width={150}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="cost" radius={[0, 20, 20, 0]} barSize={24} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">Geen transportkosten geregistreerd.</div>
            )}
          </div>
        </div>

    </div>
  );
};

export default Statistics;
