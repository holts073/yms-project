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
  Shield
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

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { state, currentUser } = useSocket();

  if (!state) {
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
      case 'dashboard': return <Dashboard />;
      case 'deliveries': return <DeliveryManager />;
      case 'addressbook': return <AddressBook />;
      case 'statistics': return <Statistics />;
      case 'logs': return <AuditLog />;
      case 'users': return <UserManagement />;
      default: return <Dashboard />;
    }
  };

  const canAccess = (tab: string) => {
    if (currentUser.role === 'admin') return true;
    if (tab === 'users' || tab === 'logs') return false;
    if (currentUser.role === 'viewer' && (tab === 'deliveries' || tab === 'addressbook')) return true; // View only handled in components
    return true;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Truck size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">LogiTrack Pro</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Truck} 
            label="Leveringen" 
            active={activeTab === 'deliveries'} 
            onClick={() => setActiveTab('deliveries')} 
          />
          <SidebarItem 
            icon={BookUser} 
            label="Adressenboek" 
            active={activeTab === 'addressbook'} 
            onClick={() => setActiveTab('addressbook')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Statistieken" 
            active={activeTab === 'statistics'} 
            onClick={() => setActiveTab('statistics')} 
          />
          <SidebarItem 
            icon={History} 
            label="Audit Log" 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')} 
          />
          {currentUser.role === 'admin' && (
            <SidebarItem 
              icon={Shield} 
              label="Gebruikers" 
              active={activeTab === 'users'} 
              onClick={() => setActiveTab('users')} 
            />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-[1.5rem] mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button className="flex items-center gap-4 px-6 py-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-medium">Uitloggen</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Zoek leveringen, leveranciers..." 
              className="w-full pl-12 pr-4 py-2.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

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
