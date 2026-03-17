import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Settings, Building2, Users, Shield, Edit2, Trash2, Plus, X } from 'lucide-react';
import UserManagement from './UserManagement';

const SettingsPage = ({ currentSegment = 'company' }: { currentSegment?: 'company' | 'users' }) => {
  const { state, dispatch, currentUser } = useSocket();
  const isAdmin = currentUser.role === 'admin';

  const [localSettings, setLocalSettings] = useState(
    state?.companySettings || {
      name: 'ILG Foodgroup',
      email: 'info@ilg-foodgroup.nl',
      phone: '+31 (0)88 000 0000',
      address: 'Voorbeeldstraat 1, 1234 AB, Nederland',
      logoUrl: '/logo.jfif',
      transportTemplate: `==========================================================
[ LOADING INFORMATION ]        | [ DELIVERY INFORMATION ]
==========================================================
Leverancier: {supplierName}
Adres: {supplierAddress}       | Bestemming: {companyName}
Laadplaats: {loadingCity}      | Adres: {companyAddress}
Land: {loadingCountry}         | ETA Magazijn: {etaWarehouse}
                               | 

==========================================================
[ KOSTEN & OPMERKINGEN ]
==========================================================
Aantal pallets: {palletCount} ({palletType})
Gewicht: {weight}
Type Lading: {cargoType}

Agreed Price (All Inclusive, Excl. Diesel): {cost}

Opmerkingen leverancier: {supplierRemarks}
Zending Opmerkingen: {notes}

Please mention our referencenumber {reference} on your invoice, this is also the loadingreference.
Without this reference number we cannot match your invoice to our booking and the paymend can be delayed.
Please note that your invoice without a signed CMR will not be processed until the CMR is present.`
    }
  );

  React.useEffect(() => {
    if (state?.companySettings) {
      setLocalSettings(state.companySettings);
    }
  }, [state?.companySettings]);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch('UPDATE_COMPANY_SETTINGS', localSettings);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {currentSegment === 'company' ? 'Bedrijfsgegevens' : 'Gebruikersbeheer'}
          </h2>
          <p className="text-slate-500 mt-1">
            {currentSegment === 'company' 
              ? 'Beheer de algemene instellingen van de organisatie.' 
              : 'Beheer de accounts en rollen van het team.'}
          </p>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
        {currentSegment === 'company' && (
          <form onSubmit={handleSaveCompany} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-1 md:col-span-2 flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {localSettings.logoUrl ? (
                    <img src={localSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
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
                          setLocalSettings(prev => ({ ...prev, logoUrl: e.target?.result as string }));
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
                  value={localSettings.name}
                  onChange={(e) => setLocalSettings({...localSettings, name: e.target.value})}
                  className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-4">Contact Email</label>
                <input 
                  type="email" 
                  value={localSettings.email}
                  onChange={(e) => setLocalSettings({...localSettings, email: e.target.value})}
                  className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-4">Telefoonnummer</label>
                <input 
                  type="text" 
                  value={localSettings.phone}
                  onChange={(e) => setLocalSettings({...localSettings, phone: e.target.value})}
                  className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-4">Hoofdkantoor</label>
                <textarea 
                  rows={2}
                  value={localSettings.address}
                  onChange={(e) => setLocalSettings({...localSettings, address: e.target.value})}
                  className="w-full px-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 ml-4">Mail Transport Order Template</label>
                  <p className="text-xs text-slate-500 ml-4 mb-2">Gebruik tags zoals <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">{`{reference}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">{`{supplierName}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">{`{loadingCity}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">{`{palletCount}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">{`{palletType}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">{`{weight}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">{`{cost}`}</code> om in te voegen. Let op: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">mailto:</code> links ondersteunen geen dikgedrukte tekst of HTML tabellen.</p>
                  <textarea 
                    rows={20}
                    value={localSettings.transportTemplate}
                    onChange={(e) => setLocalSettings({...localSettings, transportTemplate: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-[2rem] focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm leading-relaxed"
                  />
              </div>

              <div className="col-span-1 md:col-span-2 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Mailserver (SMTP) Instellingen</h3>
                <p className="text-sm text-slate-500 mb-6">Instellingen voor het verzenden van automatische mails (bijv. Wachtwoord reset). Laat u deze leeg, dan worden er geen automatische mails verstuurd.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">SMTP Host (b.v. smtp.office365.com)</label>
                    <input 
                      type="text" 
                      value={localSettings.mailServer?.host || ''}
                      onChange={(e) => setLocalSettings({...localSettings, mailServer: {...(localSettings.mailServer as any), host: e.target.value}})}
                      className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">SMTP Port (b.v. 587)</label>
                    <input 
                      type="number" 
                      value={localSettings.mailServer?.port || ''}
                      onChange={(e) => setLocalSettings({...localSettings, mailServer: {...(localSettings.mailServer as any), port: parseInt(e.target.value)}})}
                      className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Gebruikersnaam / Emailadres</label>
                    <input 
                      type="text" 
                      value={localSettings.mailServer?.user || ''}
                      onChange={(e) => setLocalSettings({...localSettings, mailServer: {...(localSettings.mailServer as any), user: e.target.value}})}
                      className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Wachtwoord</label>
                    <input 
                      type="password" 
                      value={localSettings.mailServer?.pass || ''}
                      onChange={(e) => setLocalSettings({...localSettings, mailServer: {...(localSettings.mailServer as any), pass: e.target.value}})}
                      className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                      placeholder="Laat leeg om huidig te behouden"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-4">Afzender ('From' Adres)</label>
                    <input 
                      type="email" 
                      value={localSettings.mailServer?.from || ''}
                      onChange={(e) => setLocalSettings({...localSettings, mailServer: {...(localSettings.mailServer as any), from: e.target.value}})}
                      className="w-full px-6 py-3 bg-slate-50 border-none rounded-full focus:ring-2 focus:ring-indigo-500"
                      placeholder="noreply@ilg-foodgroup.nl"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-6 flex gap-4 border-t border-slate-100">
              <button 
                type="submit"
                className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors"
                title="Sla wijzigingen direct op"
              >
                Opslaan
              </button>
            </div>
          </form>
        )}

        {currentSegment === 'users' && isAdmin && (
          <div className="content-container">
              <UserManagement embedded={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
