import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Settings, Building2, Users, Shield, Edit2, Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UserManagement from './UserManagement';

const SettingsPage = () => {
  const { state, dispatch, currentUser } = useSocket();
  const [activeSegment, setActiveSegment] = useState<'company' | 'users'>('company');
  const isAdmin = currentUser.role === 'admin';

  const [companySettings, setCompanySettings] = useState({
    name: 'ILG Foodgroup',
    email: 'info@ilg-foodgroup.nl',
    phone: '+31 (0)88 000 0000',
    address: 'Voorbeeldstraat 1, 1234 AB, Nederland',
    logoUrl: '/logo.jfif',
    transportTemplate: 'Beste vervoerder,\n\nHierbij de transport order voor {reference}.\n\nMet vriendelijke groet,\nILG Foodgroup'
  });

  const [isEditingCompany, setIsEditingCompany] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingCompany(false);
    // In future: dispatch('UPDATE_COMPANY_SETTINGS', companySettings)
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Instellingen</h2>
          <p className="text-slate-500 mt-1">Beheer bedrijfsgegevens en systeemtoegang.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <button
            onClick={() => setActiveSegment('company')}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-[1.5rem] font-bold transition-all ${
              activeSegment === 'company' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Building2 size={20} />
            Bedrijfsgegevens
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveSegment('users')}
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-[1.5rem] font-bold transition-all ${
                activeSegment === 'users' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Users size={20} />
              Gebruikersbeheer
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeSegment === 'company' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Bedrijfsprofiel</h3>
                  <p className="text-slate-500 text-sm">Algemene instellingen van de organisatie</p>
                </div>
              </div>

              {!isEditingCompany ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Bedrijfsnaam</p>
                      <p className="text-slate-900 font-medium">{companySettings.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Email</p>
                      <p className="text-slate-900 font-medium">{companySettings.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Telefoonnummer</p>
                      <p className="text-slate-900 font-medium">{companySettings.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Hoofdkantoor</p>
                      <p className="text-slate-900 font-medium">{companySettings.address}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="pt-6 border-t border-slate-100">
                      <button 
                        onClick={() => setIsEditingCompany(true)}
                        className="px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-full hover:bg-indigo-100 transition-colors"
                      >
                        Bewerken
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveCompany} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-1 md:col-span-2 flex items-center gap-6">
                      <div className="w-24 h-24 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                        {companySettings.logoUrl ? (
                          <img src={companySettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="text-slate-400" size={32} />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-bold text-slate-700 block mb-2">Bedrijfslogo</label>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setCompanySettings(prev => ({ ...prev, logoUrl: e.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-4">Bedrijfsnaam</label>
                      <input 
                        type="text" 
                        value={companySettings.name}
                        onChange={(e) => setCompanySettings({...companySettings, name: e.target.value})}
                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-4">Contact Email</label>
                      <input 
                        type="email" 
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-4">Telefoonnummer</label>
                      <input 
                        type="text" 
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-4">Hoofdkantoor</label>
                      <textarea 
                        rows={2}
                        value={companySettings.address}
                        onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                        className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                       <label className="text-sm font-bold text-slate-700 ml-4">Mail Transport Order Template</label>
                       <p className="text-xs text-slate-500 ml-4 mb-2">Gebruik <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">{`{reference}`}</code> om de referentie in te voegen.</p>
                       <textarea 
                         rows={5}
                         value={companySettings.transportTemplate}
                         onChange={(e) => setCompanySettings({...companySettings, transportTemplate: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm leading-relaxed"
                       />
                    </div>
                  </div>
                  <div className="pt-6 flex gap-4 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => setIsEditingCompany(false)}
                      className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-full transition-colors"
                    >
                      Annuleren
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors"
                    >
                      Opslaan
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeSegment === 'users' && isAdmin && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Gebruikersbeheer</h3>
                  <p className="text-slate-500 text-sm">Beheer de accounts en rollen</p>
                </div>
              </div>
              <div className="content-container">
                 {/* Reusing existing UserManagement component styling inline for integration */}
                 <UserManagement embedded={true} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
