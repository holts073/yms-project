import React, { useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { TrendingUp, Clock, Target, DollarSign, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import { useDeliveries } from '../hooks/useDeliveries';
import { StatCard } from './shared/StatCard';
import { Card } from './shared/Card';

const Statistics = () => {
  const { state, currentUser } = useSocket();
  const { addressBook } = state || {};
  const { deliveries } = useDeliveries(1, 1000, '', 'all', 'eta', false);

  const statsData = useMemo(() => {
    const completed = deliveries.filter(d => d.status === 100 || d.status === 'COMPLETED' || d.status === 'GATE_OUT');
    const active = deliveries.filter(d => d.status < 100 && d.status !== 'COMPLETED' && d.status !== 'GATE_OUT');
    
    // OTIF
    const onTime = completed.filter(d => {
      if (!d.scheduledTime) return false;
      return new Date(d.updatedAt) <= new Date(d.scheduledTime);
    });
    const otif = completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 0;

    // Lead Time
    const totalLeadTime = completed.reduce((sum, d) => {
      const diff = new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime();
      return sum + (diff / (1000 * 60 * 60 * 24));
    }, 0);
    const avgLeadTime = completed.length > 0 ? Math.round(totalLeadTime / completed.length) : 0;

    // Costs
    const totalCost = deliveries.reduce((sum, d) => sum + (d.transportCost || 0), 0);
    const totalPallets = deliveries.reduce((sum, d) => sum + (d.palletCount || 0), 0);
    const costPerPallet = totalPallets > 0 ? Math.round(totalCost / totalPallets) : 0;

    return { activeCount: active.length, otif, avgLeadTime, costPerPallet, completedCount: completed.length, onTimeCount: onTime.length };
  }, [deliveries]);

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e'];

  const typeData = [
    { name: 'Container', value: deliveries.filter(d => d.type === 'container').length },
    { name: 'Ex-Works', value: deliveries.filter(d => d.type === 'exworks').length },
  ];

  const formatCurrency = (val: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <BarChart3 className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight italic uppercase">Supply Chain Analytics</h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium tracking-widest uppercase text-xs">Inzicht in prestaties, kosten en doorlooptijden van je operatie.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Gem. Lead Time"
          value={statsData.avgLeadTime}
          unit="dagen"
          icon={<Clock size={20} />}
        />
        <StatCard 
          title="OTIF Score"
          value={statsData.otif}
          unit="%"
          icon={<Target size={20} />}
          iconClassName="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          secondaryLabel={`${statsData.onTimeCount} / ${statsData.completedCount} op tijd`}
        />
        <StatCard 
          title="Kosten / Pallet"
          value={formatCurrency(statsData.costPerPallet)}
          icon={<DollarSign size={20} />}
          iconClassName="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
        <StatCard 
          title="Actieve Zendingen"
          value={statsData.activeCount}
          unit="stuks"
          icon={<Package size={20} />}
          iconClassName="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col items-center justify-center space-y-6" padding="xl">
          <h3 className="text-xl font-bold text-foreground w-full">Type Verdeling</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value">
                  {typeData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip 
                   contentStyle={{ borderRadius: '1.5rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-8">
            {typeData.map((e, i) => (
              <div key={e.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-sm font-bold text-[var(--muted-foreground)]">{e.name}: {e.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col space-y-8" padding="xl">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">OTIF Trend per Transporteur</h3>
              <TrendingUp className="text-indigo-600" size={24} />
           </div>
           <div className="h-[300px] w-full flex items-center justify-center text-[var(--muted-foreground)] font-medium bg-[var(--muted)]/30 rounded-3xl border border-dashed border-border italic">
              Kwaliteitsmeting per transporteur in ontwikkeling...
           </div>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
