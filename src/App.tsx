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
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

import { Toaster } from 'sonner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-6 py-2.5 w-full transition-all duration-300 rounded-full",
        active 
          ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-sm" 
          : "text-slate-500 dark:text-slate-400 hover:bg-[var(--muted)]"
      )}
    >
      <Icon size={22} className={active ? "text-[var(--accent-foreground)]" : "text-slate-400 dark:text-slate-500"} />
      <span className="text-sm tracking-wide">{label}</span>
    </button>
);

const SidebarDropdown = ({ icon: Icon, label, active, items, onSelect, isOpen, onToggle }: any) => {
  return (
    <div className="w-full">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between gap-4 px-6 py-2.5 w-full transition-all duration-300 rounded-full",
          active 
            ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold shadow-sm" 
            : "text-slate-500 dark:text-slate-400 hover:bg-[var(--muted)]"
        )}
      >
        <div className="flex items-center gap-4">
          <Icon size={22} className={active ? "text-[var(--accent-foreground)]" : "text-slate-400 dark:text-slate-500"} />
          <span className="text-sm tracking-wide">{label}</span>
        </div>
        <ChevronRight size={16} className={cn("transition-transform duration-300", isOpen && "rotate-90")} />
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
                      "flex items-center gap-3 w-full px-6 py-3 rounded-full text-sm transition-all",
                      item.active 
                        ? "text-[var(--accent-foreground)] font-bold bg-[var(--accent)]/50" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-[var(--muted)]/50"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", item.active ? "bg-[var(--accent-foreground)]" : "bg-border")} />
                    {item.label}
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

    const getThemeIcon = () => {
      switch(theme) {
        case 'dark': return <Moon size={16} />;
        case 'ilg': return <div className="w-4 h-4 rounded-full bg-gradient-to-br from-rose-500 to-indigo-800" />;
        case 'meledi': return <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-500 to-stone-900" />;
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
      case 'deliveries': return <DeliveryManager initialFilter={searchFilter} initialSelectedId={selectedId || undefined} />;
      case 'archive': return <Archive />;
      case 'addressbook': return <AddressBook />;
      case 'statistics': return <Statistics />;
      case 'logs': return <AuditLog onNavigate={handleNavigate} />;
      case 'settings-company': return <SettingsPage currentSegment="company" />;
      case 'settings-documents': return <SettingsPage currentSegment="documents" />;
      case 'settings-users': return <SettingsPage currentSegment="users" />;
      case 'settings-yms': return <YmsSettings />;
      case 'reports': return <Reporting />;
      case 'yms-arrivals': return <YmsDashboard view="arrivals" />;
      case 'yms-planning': return <YmsDashboard view="planning" onBack={() => handleNavigate('dashboard')} />;
      case 'yms-public': return <YmsPublic onBack={() => handleNavigate('dashboard')} />;
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
        "bg-card border-r border-border flex flex-col p-4 transition-all duration-300",
        activeTab === 'yms-planning' ? "w-0 p-0 overflow-hidden border-none hidden md:hidden" : "w-72"
      )}>
        <div className="flex items-center gap-3 mb-6 px-4">
          <img 
            src="/logo.jfif" 
            alt="ILG Logo" 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-lg font-bold text-foreground tracking-tight leading-tight">ILG Foodgroup<br/><span className="text-xs text-indigo-600 font-black tracking-widest">YMS v3.7.3</span></h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleSidebarClick('dashboard')} 
          />
          
          <div className="pt-4 pb-1 px-6">
            <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Logistieke Flow</p>
          </div>
          
          <SidebarItem 
            icon={Truck} 
            label="Inkomend (Pipeline)" 
            active={activeTab === 'deliveries'} 
            onClick={() => handleSidebarClick('deliveries')} 
          />
          
          <div className="pt-4 pb-1 px-6">
            <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Yard Management</p>
          </div>

          <SidebarItem 
            icon={ClipboardList} 
            label="Aankomst & Inspectie" 
            active={activeTab === 'yms-arrivals'} 
            onClick={() => handleSidebarClick('yms-arrivals')} 
          />

          <SidebarItem 
            icon={Calendar} 
            label="Dock Planning" 
            active={activeTab === 'yms-planning'} 
            onClick={() => handleSidebarClick('yms-planning')} 
          />
          
          <SidebarItem 
            icon={History} 
            label="Archief (Historie)" 
            active={activeTab === 'archive'} 
            onClick={() => handleSidebarClick('archive')} 
          />

          <div className="pt-4 pb-1 px-6">
            <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Overig</p>
          </div>
          
          <SidebarItem 
            icon={BookUser} 
            label="Adressenboek" 
            active={activeTab === 'addressbook'} 
            onClick={() => handleSidebarClick('addressbook')} 
          />
          
          <SidebarItem 
            icon={Zap} 
            label="Publieke Monitor" 
            active={activeTab === 'yms-public'} 
            onClick={() => handleSidebarClick('yms-public')} 
          />

          <SidebarDropdown 
            icon={BarChart3} 
            label="Analyse & Rapportage" 
            active={['statistics', 'reports', 'logs'].includes(activeTab)} 
            isOpen={openDropdown === 'analysis'}
            onToggle={() => toggleDropdown('analysis')}
            items={[
              { id: 'statistics', label: 'Statistieken', active: activeTab === 'statistics' },
              ...(currentUser.role === 'admin' || currentUser.role === 'manager' ? [
                { id: 'reports', label: 'Rapportages', active: activeTab === 'reports' },
                { id: 'logs', label: 'Logboek', active: activeTab === 'logs' }
              ] : [])
            ]}
            onSelect={handleSidebarClick}
          />
          
          {currentUser.role === 'admin' && (
            <SidebarDropdown 
              icon={Settings} 
              label="Instellingen" 
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
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-200 hover:dark:bg-[var(--muted)] rounded-full transition-colors text-slate-500 dark:text-slate-400 flex items-center justify-center"
              title={`Huidig thema: ${theme}`}
            >
              {getThemeIcon()}
            </button>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-4 px-6 py-3 w-full text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Uitloggen</span>
          </button>
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
  const toasterTheme = (theme === 'ilg' || theme === 'meledi') ? 'dark' : (theme as 'light' | 'dark' | 'system');
  return <Toaster position="top-right" richColors theme={toasterTheme} className="pointer-events-none" toastOptions={{ className: 'pointer-events-auto' }} style={{ zIndex: 9999 }} />;
};
