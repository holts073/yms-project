import React from 'react';
import { useSocket } from '../SocketContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { TrendingUp, Award, AlertTriangle } from 'lucide-react';

const Statistics = () => {
  const { state } = useSocket();
  const { deliveries = [], addressBook } = state || {};

  // Calculate supplier reliability
  // Reliability = (Received Documents / Total Required Documents) * 100
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

    return {
      name: supplier.name,
      reliability,
      deliveries: supplierDeliveries.length
    };
  }).sort((a, b) => b.reliability - a.reliability) || [];

  const typeData = [
    { name: 'Container', value: deliveries.filter(d => d.type === 'container').length },
    { name: 'Ex-Works', value: deliveries.filter(d => d.type === 'exworks').length },
  ];

  const COLORS = ['#4f46e5', '#f97316'];

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Statistieken</h2>
        <p className="text-slate-500 mt-1">Inzicht in de betrouwbaarheid van leveranciers en operationele prestaties.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reliability Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Betrouwbaarheid per Leverancier (%)</h3>
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full text-sm font-bold">
              <TrendingUp size={16} />
              <span>+4.2% deze maand</span>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
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
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="reliability" radius={[0, 20, 20, 0]} barSize={32}>
                  {supplierStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.reliability > 80 ? '#10b981' : entry.reliability > 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-8">
          <h3 className="text-xl font-bold text-slate-900 w-full text-left">Type Verdeling</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
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
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 flex items-center gap-6">
          <div className="p-5 bg-white text-emerald-600 rounded-3xl shadow-sm">
            <Award size={32} />
          </div>
          <div>
            <h4 className="text-emerald-900 font-bold text-lg">Top Leverancier</h4>
            <p className="text-emerald-700 font-medium">{supplierStats[0]?.name || 'N/A'}</p>
            <p className="text-emerald-600 text-sm mt-1">{supplierStats[0]?.reliability || 0}% documentatie score</p>
          </div>
        </div>

        <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex items-center gap-6">
          <div className="p-5 bg-white text-amber-600 rounded-3xl shadow-sm">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h4 className="text-amber-900 font-bold text-lg">Aandacht Vereist</h4>
            <p className="text-amber-700 font-medium">{supplierStats[supplierStats.length - 1]?.name || 'N/A'}</p>
            <p className="text-amber-600 text-sm mt-1">{supplierStats[supplierStats.length - 1]?.reliability || 0}% documentatie score</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
