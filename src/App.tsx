import React, { useState } from 'react';
import { SocketProvider, useSocket } from './SocketContext';
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 px-6 py-4 w-full transition-all duration-300 rounded-full",
      active 
        ? "bg-indigo-100 text-indigo-900 font-semibold shadow-sm" 
        : "text-slate-600 hover:bg-slate-100"
    )}
  >
    <Icon size={22} className={active ? "text-indigo-600" : "text-slate-500"} />
    <span className="text-sm tracking-wide">{label}</span>
  </button>
);

const SidebarDropdown = ({ icon: Icon, label, active, items, onSelect }: any) => {
  const [isOpen, setIsOpen] = useState(active);
  React.useEffect(() => { if (active) setIsOpen(true); }, [active]);

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-4 px-6 py-4 w-full transition-all duration-300 rounded-full",
          active 
            ? "bg-indigo-100 text-indigo-900 font-semibold shadow-sm" 
            : "text-slate-600 hover:bg-slate-100"
        )}
      >
        <div className="flex items-center gap-4">
          <Icon size={22} className={active ? "text-indigo-600" : "text-slate-500"} />
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
                      ? "text-indigo-700 font-bold bg-indigo-50" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", item.active ? "bg-indigo-600" : "bg-slate-400")} />
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
    const { state, currentUser, isAuthenticated, logout } = useSocket();
  
    const handleNavigate = (tab: string, reference?: string, id?: string) => {
    setActiveTab(tab);
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
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  if (!state || !currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
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
      case 'settings-users': return <SettingsPage currentSegment="users" />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  const canAccess = (tab: string) => {
    if (currentUser?.role === 'admin') return true;
    if (tab.startsWith('settings')) return false; 
    if (currentUser?.role === 'viewer' && (tab === 'deliveries' || tab === 'addressbook' || tab === 'archive')) return true; 
    return true;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-4">
          <img 
            src="/logo.jfif" 
            alt="ILG Logo" 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">ILG Foodgroup<br/><span className="text-xs text-indigo-600">SCV / YMS v2.0.1</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => handleSidebarClick('dashboard')} 
          />
          <SidebarItem 
            icon={Truck} 
            label="Leveringen" 
            active={activeTab === 'deliveries'} 
            onClick={() => handleSidebarClick('deliveries')} 
          />
          <SidebarItem 
            icon={BookUser} 
            label="Adressenboek" 
            active={activeTab === 'addressbook'} 
            onClick={() => handleSidebarClick('addressbook')} 
          />
          <SidebarItem 
            icon={History} 
            label="Archief" 
            active={activeTab === 'archive'} 
            onClick={() => handleSidebarClick('archive')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Statistieken" 
            active={activeTab === 'statistics'} 
            onClick={() => handleSidebarClick('statistics')} 
          />
          {currentUser.role === 'admin' && (
            <SidebarDropdown 
              icon={Settings} 
              label="Instellingen" 
              active={activeTab.startsWith('settings')} 
              items={[
                { id: 'settings-company', label: 'Bedrijfsgegevens', active: activeTab === 'settings-company' },
                { id: 'settings-users', label: 'Gebruikersbeheer', active: activeTab === 'settings-users' }
              ]}
              onSelect={handleSidebarClick}
            />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-[1.5rem] mb-4 mt-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-4 px-6 py-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
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
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}
