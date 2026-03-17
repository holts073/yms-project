import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Settings, Building2, Users, Shield, Edit2, Trash2, Plus, X } from 'lucide-react';
import UserManagement from './UserManagement';

const SettingsPage = ({ currentSegment = 'company' }: { currentSegment?: 'company' | 'users' | 'documents' }) => {
  const { state, dispatch, currentUser } = useSocket();
  const isAdmin = currentUser.role === 'admin';

  const [localSettings, setLocalSettings] = useState(
    state?.companySettings || {
      name: 'ILG Foodgroup',
      email: 'info@ilg-foodgroup.nl',
      phone: '+31 (0)88 000 0000',
      address: 'Voorbeeldstraat 1, 1234 AB, Nederland',
      logoUrl: '/logo.jfif',
      transportTemplate: `...`
    }
  );

  const [docSettings, setDocSettings] = useState(
    state?.settings?.shipment_settings || { container: [], exworks: [] }
  );

  React.useEffect(() => {
    if (state?.companySettings) {
      setLocalSettings(state.companySettings);
    }
    if (state?.settings?.shipment_settings) {
      setDocSettings(state.settings.shipment_settings);
    }
  }, [state?.companySettings, state?.settings?.shipment_settings]);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch('UPDATE_COMPANY_SETTINGS', localSettings);
  };

  const handleSaveDocuments = () => {
    dispatch('UPDATE_SETTINGS', { ...state?.settings, shipment_settings: docSettings });
  };

  const addDocument = (type: 'container' | 'exworks') => {
    const name = window.prompt('Voer de naam van het nieuwe document in:');
    if (name) {
      setDocSettings({
        ...docSettings,
        [type]: [...docSettings[type], { name, required: false }]
      });
    }
  };

  const removeDocument = (type: 'container' | 'exworks', index: number) => {
    if (window.confirm('Weet u zeker dat u dit document wilt verwijderen?')) {
      const newList = [...docSettings[type]];
      newList.splice(index, 1);
      setDocSettings({ ...docSettings, [type]: newList });
    }
  };

  const toggleRequired = (type: 'container' | 'exworks', index: number) => {
    const newList = [...docSettings[type]];
    newList[index] = { ...newList[index], required: !newList[index].required };
    setDocSettings({ ...docSettings, [type]: newList });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            {currentSegment === 'company' ? 'Bedrijfsgegevens' : currentSegment === 'users' ? 'Gebruikersbeheer' : 'Documentinstellingen'}
          </h2>
          <p className="text-slate-500 mt-1">
            {currentSegment === 'company' 
              ? 'Beheer de algemene instellingen van de organisatie.' 
              : currentSegment === 'users'
              ? 'Beheer de accounts en rollen van het team.'
              : 'Beheer de verplichte en optionele documenten per type zending.'}
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

        {currentSegment === 'documents' && isAdmin && (
          <div className="space-y-10">
            {(['container', 'exworks'] as const).map(type => (
              <div key={type} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-900 capitalize">
                    {type === 'container' ? 'Zeevracht (Container)' : 'Wegtransport (Ex-Works)'}
                  </h3>
                  <button 
                    onClick={() => addDocument(type)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <Plus size={14} /> Document Toevoegen
                  </button>
                </div>
                <div className="grid gap-3">
                  {docSettings[type]?.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                          <Settings size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.required ? 'Verplicht' : 'Optioneel'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleRequired(type, index)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                            doc.required ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          )}
                        >
                          {doc.required ? 'Maak Optioneel' : 'Maak Verplicht'}
                        </button>
                        <button 
                          onClick={() => removeDocument(type, index)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!docSettings[type] || docSettings[type].length === 0) && (
                    <p className="text-center py-6 text-slate-400 text-sm">Geen documenten geconfigureerd.</p>
                  )}
                </div>
              </div>
            ))}
            
            <div className="pt-6 border-t border-slate-100">
              <button 
                onClick={handleSaveDocuments}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Documentinstellingen Opslaan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default SettingsPage;
