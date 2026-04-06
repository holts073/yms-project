import React, { createContext, useContext, useEffect, useState } from 'react';
import { SocketProvider, useSocket } from './SocketContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { 
  LayoutDashboard, 
  Truck, 
  BookUser, 
  BarChart3, 
  History, 
  Plus, 
  Bell,
  Search,
  Settings,
  LogOut,
  User as UserIcon,
  Shield,
  ChevronRight,
  FileText,
  ClipboardList,
  Zap,
  Calendar,
  BadgeEuro,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePermissions } from './hooks/usePermissions';
import { FeatureGate } from './components/shared/FeatureGate';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sun, Moon, Palette } from 'lucide-react';

// UI Components
import Dashboard from './components/Dashboard';
import DeliveryManager from './components/DeliveryManager';
import AddressBook from './components/AddressBook';
import Statistics from './components/Statistics';
import AuditLog from './components/AuditLog';
import UserManagement from './components/UserManagement';
import { Login } from './components/Login';
import Archive from './components/Archive';
import SettingsPage from './components/Settings';
import Reporting from './components/Reporting';
import YmsDashboard from './components/YmsDashboard';
import YmsSettings from './components/YmsSettings';
import YmsPublic from './components/YmsPublic';
import { Reconciliation } from './components/features/Reconciliation';
import { AccountSettings } from './components/AccountSettings';

import { Toaster } from 'sonner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getColorStyles = (colorClass: string) => {
  const colorMap: Record<string, any> = {
    'text-blue-500': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', pill: 'bg-blue-500' },
    'text-amber-500': { bg: 'bg-amber-500/10', border: 'border-amber-500/20', pill: 'bg-amber-500' },
    'text-emerald-500': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', pill: 'bg-emerald-500' },
    'text-indigo-500': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', pill: 'bg-indigo-500' },
    'text-rose-500': { bg: 'bg-rose-500/10', border: 'border-rose-500/20', pill: 'bg-rose-500' },
    'text-violet-500': { bg: 'bg-violet-500/10', border: 'border-violet-500/20', pill: 'bg-violet-500' },
    'text-slate-500': { bg: 'bg-slate-500/10', border: 'border-slate-500/20', pill: 'bg-slate-500' },
    'text-indigo-600': { bg: 'bg-indigo-600/10', border: 'border-indigo-500/20', pill: 'bg-indigo-600' },
  };
  return colorMap[colorClass] || colorMap['text-indigo-600'];
};

const SidebarItem = ({ icon: Icon, label, active, onClick, color = "text-indigo-600", locked = false }: any) => {
  const styles = getColorStyles(color);
  
  return (
    <button
      onClick={onClick}
      disabled={locked && active} // Don't allow clicking the locked item if it's already "active" (e.g. by deep link)
      className={cn(
        "flex items-center gap-3 px-5 py-3 w-full transition-all duration-300 rounded-2xl relative group mb-1",
        active 
          ? cn(styles.bg, "font-bold shadow-sm border", styles.border) 
          : "text-slate-500 dark:text-slate-400 hover:bg-[var(--muted)]/50",
        locked && !active && "opacity-60 grayscale-[0.5] hover:grayscale-0"
      )}
    >
      {active && (
        <motion.div 
          layoutId="active-pill" 
          className={cn("absolute left-0 w-1.5 h-6 rounded-r-full shadow-[0_0_8px_rgba(0,0,0,0.1)]", styles.pill)} 
          initial={{ x: -5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative">
        <Icon 
          size={20} 
          className={cn(
            "transition-transform duration-300", 
            active ? cn(color, "scale-110") : `${color} opacity-40 group-hover:opacity-100 group-hover:scale-110`
          )} 
        />
        {locked && (
          <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm border border-border">
            <Lock size={8} className="text-rose-500" />
          </div>
        )}
      </div>
      <span className={cn(
        "text-sm tracking-tight transition-colors flex-1 text-left",
        active ? "text-foreground" : ""
      )}>{label}</span>
      {locked && (
        <span className="text-[9px] font-black uppercase tracking-tight text-rose-500/60 bg-rose-500/5 px-2 py-0.5 rounded-full border border-rose-500/10">
          PRO
        </span>
      )}
      {active && (
        <motion.div 
          layoutId="active-glow"
          className={cn("absolute inset-0 rounded-2xl -z-10 blur-xl opacity-20", styles.bg)}
        />
      )}
    </button>
  );
};

const SidebarDropdown = ({ icon: Icon, label, active, items, onSelect, isOpen, onToggle, color = "text-indigo-600", locked = false }: any) => {
  const styles = getColorStyles(color);

  return (
    <div className="w-full mb-1">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between gap-3 px-5 py-3 w-full transition-all duration-300 rounded-2xl group relative",
          active 
            ? cn(styles.bg, "font-bold border shadow-sm", styles.border) 
            : "text-slate-500 dark:text-slate-400 hover:bg-[var(--muted)]/50",
          locked && !active && "opacity-60"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon 
              size={20} 
              className={cn(
                "transition-transform duration-300", 
                active ? cn(color, "scale-110") : `${color} opacity-40 group-hover:opacity-100 group-hover:scale-110`
              )} 
            />
            {locked && (
              <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm border border-border">
                <Lock size={8} className="text-rose-500" />
              </div>
            )}
          </div>
          <span className={cn(
            "text-sm tracking-tight transition-colors",
            active ? "text-foreground" : ""
          )}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {locked && (
            <span className="text-[9px] font-black uppercase tracking-tight text-rose-500/60 bg-rose-500/5 px-2 py-0.5 rounded-full border border-rose-500/10">
              PRO
            </span>
          )}
          <ChevronRight size={14} className={cn("transition-transform duration-300 opacity-50", isOpen && "rotate-90")} />
        </div>
        {active && (
          <motion.div 
            layoutId="active-glow-dropdown"
            className={cn("absolute inset-0 rounded-2xl -z-10 blur-xl opacity-10", styles.bg)}
          />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="py-2 px-4 space-y-1 mt-1">
              {items.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-6 py-3 rounded-full text-sm transition-all group/sub",
                      item.active 
                        ? "text-[var(--accent-foreground)] font-bold bg-[var(--accent)]/50" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-[var(--muted)]/50"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className={cn("w-1.5 h-1.5 rounded-full", item.active ? "bg-[var(--accent-foreground)]" : "bg-border group-hover/sub:bg-indigo-400")} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.locked && (
                         <Lock size={10} className="text-rose-500 opacity-60" />
                      )}
                    </div>
                  </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

  const AppContent = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchFilter, setSearchFilter] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const { state, currentUser, isAuthenticated, logout } = useSocket();
    const { theme, toggleTheme } = useTheme();
    const { canAccess: checkAccess } = usePermissions();

    const getThemeIcon = () => {
      switch(theme) {
        case 'dark': return <Moon size={16} />;
        case 'enterprise': return <div className="w-4 h-4 rounded-full bg-gradient-to-br from-rose-500 to-indigo-800" />;
        case 'modern': return <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-500 to-stone-900" />;
        default: return <Sun size={16} />;
      }
    };

    React.useEffect(() => {
      if (['statistics', 'reports', 'logs'].includes(activeTab)) {
        setOpenDropdown('analysis');
      } else if (activeTab.startsWith('settings')) {
        setOpenDropdown('settings');
      }
    }, []);

    const handleNavigate = (tab: string, reference?: string, id?: string) => {
      setActiveTab(tab);
      if (['statistics', 'reports', 'logs'].includes(tab)) {
        setOpenDropdown('analysis');
      } else if (tab.startsWith('settings')) {
        setOpenDropdown('settings');
      } else {
        setOpenDropdown(null);
      }

      if (id) {
        setSelectedId(id);
        setSearchFilter('');
      } else if (reference) {
        setSearchFilter(reference);
        setSelectedId(null);
      } else {
        setSearchFilter('');
        setSelectedId(null);
      }
    };

  const handleSidebarClick = (tab: string) => {
    setActiveTab(tab);
    setSelectedId(null);
    if (tab === 'deliveries') {
      setSearchFilter(''); // Reset filter when clicking deliveries tab
    }
    
    // Close dropdowns when clicking a top-level item that isn't in a dropdown
    if (!['statistics', 'reports', 'logs'].includes(tab) && !tab.startsWith('settings')) {
      setOpenDropdown(null);
    }
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Special logic for Public Page (can be accessed without auth if specifically requested)
  const isPublicHash = window.location.hash.includes('yms-public');
  
  if (!isAuthenticated || !currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'deliveries': 
        return (
          <FeatureGate capability="LOGISTICS_DELIVERY_CRUD" mode="gate">
            <DeliveryManager initialFilter={searchFilter} initialSelectedId={selectedId || undefined} />
          </FeatureGate>
        );
      case 'archive': 
        return (
          <FeatureGate capability="LOGISTICS_DELIVERY_CRUD" mode="gate">
            <Archive />
          </FeatureGate>
        );
      case 'addressbook': 
        return (
          <FeatureGate capability="ADDR_BOOK_CRUD" mode="gate">
            <AddressBook />
          </FeatureGate>
        );
      case 'statistics': 
        return (
          <FeatureGate capability="FINANCE_LEDGER_VIEW" mode="gate">
            <Statistics />
          </FeatureGate>
        );
      case 'logs': 
        return (
          <FeatureGate capability="SYSTEM_SETTINGS_EDIT" mode="gate">
            <AuditLog onNavigate={handleNavigate} />
          </FeatureGate>
        );
      case 'settings-company': 
      case 'settings-documents': 
      case 'settings-users': 
        return (
          <FeatureGate capability="SYSTEM_SETTINGS_EDIT" mode="gate">
            <SettingsPage currentSegment={activeTab.split('-')[1] as any} />
          </FeatureGate>
        );
      case 'settings-yms': 
        return (
          <FeatureGate capability="SYSTEM_SETTINGS_EDIT" mode="gate">
            <YmsSettings />
          </FeatureGate>
        );
      case 'settings-account': return <AccountSettings />;
      case 'reports': 
        return (
          <FeatureGate capability="SYSTEM_SETTINGS_EDIT" mode="gate">
            <Reporting />
          </FeatureGate>
        );
      case 'yms-arrivals': 
        return (
          <FeatureGate capability="YMS_STATUS_UPDATE" mode="gate">
            <YmsDashboard view="arrivals" initialSearch={searchFilter} onBack={() => handleNavigate('dashboard')} />
          </FeatureGate>
        );
      case 'yms-planning': 
        return (
          <FeatureGate capability="YMS_STATUS_UPDATE" mode="gate">
            <YmsDashboard view="planning" initialSearch={searchFilter} onBack={() => handleNavigate('dashboard')} />
          </FeatureGate>
        );
      case 'yms-public': return <YmsPublic onBack={() => handleNavigate('dashboard')} />;
      case 'pallet-reconciliation': 
        return (
          <FeatureGate feature="enableFinance" capability="FINANCE_SETTLE_TRANSACTION" mode="gate">
            <Reconciliation />
          </FeatureGate>
        );
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  const canAccess = (tab: string) => {
    if (currentUser?.role === 'admin') return true;
    if (tab.startsWith('settings')) return false; 
    if (currentUser?.role === 'viewer' && (tab === 'deliveries' || tab === 'addressbook' || tab === 'archive')) return true; 
    return true;
  };

  if (activeTab === 'yms-public' || isPublicHash) {
    return <YmsPublic onBack={() => {
      if (isAuthenticated) handleNavigate('dashboard');
      else window.location.hash = ''; // Return to Login
    }} />;
  }

  const renderLoadingState = () => (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-4">
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-12 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-[2rem]" />
        <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-[2rem]" />
        <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-[2rem]" />
      </div>
      <div className="h-[500px] w-full bg-slate-50 dark:bg-slate-950/50 rounded-[3rem]" />
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border flex flex-col p-4 transition-all duration-300 w-72"
      )}>
        <div className="flex items-center gap-3 mb-6 px-4">
          <img 
            src="/logo.jfif" 
            alt="ILG Logo" 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-lg font-black text-foreground tracking-tight leading-tight uppercase italic">
            ILG Foodgroup
          </h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            color="text-blue-500"
            active={activeTab === 'dashboard'} 
            onClick={() => handleSidebarClick('dashboard')} 
          />
          
          {currentUser.role !== 'operator' && currentUser.role !== 'lead_operator' && (
            <>
              <div className="pt-4 pb-1 px-6">
                <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Logistieke Flow</p>
              </div>
              
              <SidebarItem 
                icon={Truck} 
                label="Inkomend (Pipeline)" 
                color="text-amber-500"
                active={activeTab === 'deliveries'} 
                onClick={() => handleSidebarClick('deliveries')} 
                locked={!checkAccess('LOGISTICS_DELIVERY_CRUD').granted}
              />
            </>
          )}
          
          <div className="pt-4 pb-1 px-6">
            <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Yard Management</p>
          </div>

          <SidebarItem 
            icon={ClipboardList} 
            label="Aankomst & Inspectie" 
            color="text-emerald-500"
            active={activeTab === 'yms-arrivals'} 
            onClick={() => handleSidebarClick('yms-arrivals')} 
            locked={!checkAccess('YMS_STATUS_UPDATE').granted}
          />

          <SidebarItem 
            icon={Calendar} 
            label="Dock Planning" 
            color="text-emerald-500"
            active={activeTab === 'yms-planning'} 
            onClick={() => handleSidebarClick('yms-planning')} 
            locked={!checkAccess('YMS_DOCK_MANAGE').granted}
          />
          
          <SidebarItem 
            icon={History} 
            label="Archief (Historie)" 
            color="text-emerald-500"
            active={activeTab === 'archive'} 
            onClick={() => handleSidebarClick('archive')} 
            locked={!checkAccess('LOGISTICS_DELIVERY_CRUD').granted}
          />

          {currentUser.role !== 'operator' && currentUser.role !== 'lead_operator' && (
            <>
              <div className="pt-6 pb-2 px-6">
                <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em] opacity-60">Overig</p>
              </div>
              
              <SidebarItem 
                icon={BookUser} 
                label="Adressenboek" 
                color="text-indigo-500"
                active={activeTab === 'addressbook'} 
                onClick={() => handleSidebarClick('addressbook')} 
                locked={!checkAccess('ADDR_BOOK_CRUD').granted}
              />
            </>
          )}
          
          <SidebarItem 
            icon={Zap} 
            label="Publieke Monitor" 
            color="text-indigo-500"
            active={activeTab === 'yms-public'} 
            onClick={() => handleSidebarClick('yms-public')} 
          />

          {currentUser.role !== 'operator' && 
           currentUser.role !== 'lead_operator' && (
            <>
              <div className="pt-4 pb-1 px-6">
                <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Financiën</p>
              </div>

              <SidebarItem 
                icon={BadgeEuro} 
                label="Pallet Reconciliatie" 
                color="text-rose-500"
                active={activeTab === 'pallet-reconciliation'} 
                onClick={() => handleSidebarClick('pallet-reconciliation')} 
                locked={!checkAccess('FINANCE_SETTLE_TRANSACTION', 'enableFinance').granted}
              />
            </>
          )}

          <SidebarDropdown 
            icon={BarChart3} 
            label="Analyse & Rapportage" 
            color="text-violet-500"
            active={['statistics', 'reports', 'logs'].includes(activeTab)} 
            isOpen={openDropdown === 'analysis'}
            onToggle={() => toggleDropdown('analysis')}
            locked={!checkAccess('SYSTEM_SETTINGS_EDIT').granted && !checkAccess('FINANCE_LEDGER_VIEW').granted} // Prikkeling voor viewer
            items={[
              { id: 'statistics', label: 'Statistieken', active: activeTab === 'statistics', locked: !checkAccess('FINANCE_LEDGER_VIEW').granted },
              ...(currentUser.role === 'admin' || currentUser.role === 'manager' || true ? [ // Always show for upsells
                { id: 'reports', label: 'Rapportages', active: activeTab === 'reports', locked: !checkAccess('SYSTEM_SETTINGS_EDIT').granted },
                { id: 'logs', label: 'Logboek', active: activeTab === 'logs', locked: !checkAccess('SYSTEM_SETTINGS_EDIT').granted }
              ] : [])
            ]}
            onSelect={handleSidebarClick}
          />
          
          {currentUser.role === 'admin' && (
            <SidebarDropdown 
              icon={Settings} 
              label="Instellingen" 
              color="text-slate-500"
              active={activeTab.startsWith('settings')} 
              isOpen={openDropdown === 'settings'}
              onToggle={() => toggleDropdown('settings')}
              items={[
                { id: 'settings-company', label: 'Bedrijfsgegevens', active: activeTab === 'settings-company' },
                { id: 'settings-documents', label: 'Documentinstellingen', active: activeTab === 'settings-documents' },
                { id: 'settings-yms', label: 'YMS Instellingen', active: activeTab === 'settings-yms' },
                { id: 'settings-users', label: 'Gebruikersbeheer', active: activeTab === 'settings-users' }
              ]}
              onSelect={handleSidebarClick}
            />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--muted)] rounded-[1.5rem] mb-4 mt-4 transition-colors">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{currentUser.role}</p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleNavigate('settings-account')}
                className={cn(
                  "p-2 hover:bg-slate-200 hover:dark:bg-slate-700 rounded-full transition-colors",
                  activeTab === 'settings-account' ? "text-indigo-600 bg-indigo-500/10" : "text-slate-500 dark:text-slate-400"
                )}
                title="Account Beveiliging"
              >
                <Shield size={16} />
              </button>
              <button 
                onClick={toggleTheme}
                className="p-2 hover:bg-slate-200 hover:dark:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400 flex items-center justify-center"
                title={`Huidig thema: ${theme}`}
              >
                {getThemeIcon()}
              </button>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-4 px-6 py-3 w-full text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors mb-2"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Uitloggen</span>
          </button>
          
          <div className="px-6 pb-2 pt-2 border-t border-border/50 flex justify-between items-center opacity-40">
            <span className="text-[10px] font-black tracking-widest uppercase italic">YMS Control Tower</span>
            <span className="text-[10px] font-bold tracking-widest">v3.13.2</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {!state ? renderLoadingState() : renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <ThemeAwareToaster />
        <AppContent />
      </SocketProvider>
    </ThemeProvider>
  );
}

const ThemeAwareToaster = () => {
  const { theme } = useTheme();
  const toasterTheme = (theme === 'enterprise' || theme === 'modern') ? 'dark' : (theme as 'light' | 'dark' | 'system');
  return <Toaster position="top-right" richColors theme={toasterTheme} className="pointer-events-none" toastOptions={{ className: 'pointer-events-auto' }} style={{ zIndex: 9999 }} />;
};
