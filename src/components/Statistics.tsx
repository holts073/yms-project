import React, { useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { usePermissions } from '../hooks/usePermissions';
import { AccessDenied } from './shared/AccessDenied';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { TrendingUp, Clock, Target, DollarSign, Package, AlertTriangle, BarChart3, Truck, Activity } from 'lucide-react';
import { useDeliveries } from '../hooks/useDeliveries';
import { useYmsData } from '../hooks/useYmsData';
import { StatCard } from './shared/StatCard';
import { Card } from './shared/Card';
import { isRegisteredOnTime } from '../lib/logistics';
import { CarrierPerformance } from './features/CarrierPerformance';
import { cn } from '../lib/utils';

const Statistics = () => {
  const { state, currentUser } = useSocket();
  const { canAccess } = usePermissions();
  const { granted: isAuthorized } = canAccess('FINANCE_LEDGER_VIEW');

  const { addressBook } = state || {};
  const { deliveries } = useDeliveries(1, 1000, '', 'all', 'eta', false);

  const yms = useYmsData();

  const statsData = useMemo(() => {
    const completed = deliveries.filter(d => d.status === 100);
    const active = deliveries.filter(d => d.status < 100);
    
    // OTIF
    const onTime = completed.filter(d => {
      const targetTime = d.eta || d.etaWarehouse;
      if (!targetTime) return false;
      return new Date(d.updatedAt) <= new Date(targetTime);
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

    // 24h Compliance
    const timely = deliveries.filter(d => isRegisteredOnTime(d));
    const complianceRate = deliveries.length > 0 ? Math.round((timely.length / deliveries.length) * 100) : 0;

    return { 
      activeCount: active.length, 
      otif, 
      avgLeadTime, 
      costPerPallet, 
      completedCount: completed.length, 
      onTimeCount: onTime.length,
      complianceRate,
      timelyCount: timely.length,
      totalCount: deliveries.length
    };
  }, [deliveries]);

  const completedYms = useMemo(() => yms.deliveries.filter(d => d.status === 'COMPLETED' || d.status === 'GATE_OUT'), [yms.deliveries]);

  const ymsStats = useMemo(() => {
    const totalDocks = yms.docks.length;
    const occupiedDocks = yms.docks.filter(d => d.status === 'Occupied').length;
    const dockOccupancy = totalDocks > 0 ? Math.round((occupiedDocks / totalDocks) * 100) : 0;

    const totalDwell = completedYms.reduce((sum, d) => sum + (d.estimatedDuration || 60), 0); // Mock dwell computation
    const avgDwellHours = completedYms.length > 0 ? (totalDwell / completedYms.length / 60) : 0;

    const exWorks = yms.deliveries.filter(d => d.direction === 'OUTBOUND');
    const delayedExWorks = exWorks.filter(d => d.isLate);
    const exWorksDelayRate = exWorks.length > 0 ? Math.round((delayedExWorks.length / exWorks.length) * 100) : 0;

    return { dockOccupancy, avgDwellHours: avgDwellHours.toFixed(1), exWorksDelayRate };
  }, [yms.deliveries, yms.docks]);

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e'];

  const typeData = [
    { name: 'Container', value: deliveries.filter(d => d.type === 'container').length },
    { name: 'Ex-Works', value: deliveries.filter(d => d.type === 'exworks').length },
  ];

  // Mock data for Recharts
  const dockData = yms.docks.map(d => ({ name: d.name, active: d.status === 'Occupied' ? 100 : 0, available: d.status === 'Available' ? 100 : 0 }));
  const dwellData = completedYms.length > 0 ? [{ day: 'Ma', uren: 1.1 }, { day: 'Di', uren: 1.4 }, { day: 'Wo', uren: 1.2 }, { day: 'Do', uren: 1.8 }, { day: 'Vr', uren: 1.3 }] : [];
  const delayData = yms.deliveries.length > 0 ? [{ name: 'Op tijd', value: 100 - ymsStats.exWorksDelayRate }, { name: 'Vertraagd', value: ymsStats.exWorksDelayRate }] : [];

  const formatCurrency = (val: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="relative">
      {!isAuthorized && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-sm rounded-[3rem] p-10">
           <AccessDenied 
             title="Premium Analytics Ontwikkelen?" 
             description="Krijg real-time inzicht in OTIF-scores, lead times en dock-bezetting. Deze data helpt u uw operatie te optimaliseren en kosten te verlagen."
             feature="Advanced Analytics"
           />
        </div>
      )}
      
      <div className={cn("space-y-10 pb-20 transition-all duration-700", !isAuthorized && "blur-md pointer-events-none select-none opacity-40")}>
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
        <StatCard 
          title="24h Compliance"
          value={statsData.complianceRate}
          unit="%"
          icon={<Activity size={20} />}
          iconClassName="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          secondaryLabel={`${statsData.timelyCount} / ${statsData.totalCount} tijdige aanmeldingen`}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-border">
        {/* Dock Occupancy Bar Chart */}
        <Card className="flex flex-col space-y-6" padding="xl">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold text-foreground">Dock Bezetting</h3>
             <span className="text-2xl font-black text-indigo-600">{ymsStats.dockOccupancy}%</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: '1rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                <Bar dataKey="active" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} name="Bezet" />
                <Bar dataKey="available" stackId="a" fill="var(--muted)" radius={[4, 4, 0, 0]} name="Beschikbaar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Avg Dwell Time Line Chart */}
        <Card className="flex flex-col space-y-6" padding="xl">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold text-foreground">Gemiddelde Dwell-time</h3>
             <span className="text-2xl font-black text-amber-500">{ymsStats.avgDwellHours}u</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dwellData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUren" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '1rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                <Area type="monotone" dataKey="uren" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorUren)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Ex-works Delays Pie Chart */}
        <Card className="flex flex-col space-y-6" padding="xl">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold text-foreground">Ex-works Vertraging</h3>
             <span className="text-2xl font-black text-rose-500">{ymsStats.exWorksDelayRate}%</span>
          </div>
          <div className="h-[250px] w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={delayData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  <Cell key="cell-0" fill="#10b981" />
                  <Cell key="cell-1" fill="#f43f5e" />
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '1rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"><div className="w-3 h-3 rounded-full bg-emerald-500"></div>Op tijd</div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"><div className="w-3 h-3 rounded-full bg-rose-500"></div>Vertraagd</div>
            </div>
          </div>
        </Card>
      </div>
      <div className="pt-8 border-t border-border">
        <CarrierPerformance />
      </div>
    </div>
  </div>
);
};

export default Statistics;
