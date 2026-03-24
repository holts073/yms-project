import React, { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { Building2, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import UserManagement from './UserManagement';
import { Input } from './shared/Input';
import { Button } from './shared/Button';
import { Card } from './shared/Card';
import { Badge } from './shared/Badge';
import { cn } from '../lib/utils';

const SettingsPage = ({ currentSegment = 'company' }: { currentSegment?: 'company' | 'users' | 'documents' }) => {
  const { state, dispatch, currentUser } = useSocket();
  const isAdmin = currentUser.role === 'admin';

  const [localSettings, setLocalSettings] = useState(state?.companySettings || {
    name: 'ILG Foodgroup',
    email: 'info@ilg-foodgroup.nl',
    phone: '+31 (0)88 000 0000',
    address: 'Voorbeeldstraat 1, 1234 AB, Nederland',
    logoUrl: '/logo.jfif',
    transportTemplate: ''
  });

  const [docSettings, setDocSettings] = useState(state?.settings?.shipment_settings || { container: [], exworks: [] });

  useEffect(() => {
    if (state?.companySettings) setLocalSettings(state.companySettings);
    if (state?.settings?.shipment_settings) setDocSettings(state.settings.shipment_settings);
  }, [state?.companySettings, state?.settings?.shipment_settings]);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch('UPDATE_COMPANY_SETTINGS', localSettings);
  };

  const handleSaveDocuments = () => {
    dispatch('UPDATE_SETTINGS', { ...state?.settings, shipment_settings: docSettings });
  };

  const addDocument = (type: 'container' | 'exworks') => {
    const name = window.prompt('Documentnaam:');
    if (name) setDocSettings({ ...docSettings, [type]: [...docSettings[type], { name, required: false }] });
  };

  const toggleRequired = (type: 'container' | 'exworks', index: number) => {
    const newList = [...docSettings[type]];
    newList[index] = { ...newList[index], required: !newList[index].required };
    setDocSettings({ ...docSettings, [type]: newList });
  };

  const removeDoc = (type: 'container' | 'exworks', index: number) => {
    if (confirm('Verwijderen?')) {
      const newList = [...docSettings[type]];
      newList.splice(index, 1);
      setDocSettings({ ...docSettings, [type]: newList });
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
            <SettingsIcon className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-foreground tracking-tight italic uppercase">
              {currentSegment === 'company' ? 'Organisatie' : currentSegment === 'users' ? 'Team' : 'Documenten'}
            </h2>
            <p className="text-[var(--muted-foreground)] mt-1 font-medium tracking-widest uppercase text-xs">Beheer de globale configuratie en standaarden van het systeem.</p>
          </div>
        </div>
      </header>

      {currentSegment === 'company' && (
        <form onSubmit={handleSaveCompany} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 h-fit" padding="xl">
             <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-32 h-32 bg-[var(--muted)] rounded-3xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                  {localSettings.logoUrl ? <img src={localSettings.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" /> : <Building2 className="text-[var(--muted-foreground)]" size={40} />}
                </div>
                <div>
                   <h3 className="font-bold text-foreground text-lg">{localSettings.name}</h3>
                   <p className="text-sm text-[var(--muted-foreground)] font-medium">Bedrijfsidentiteit</p>
                </div>
                <input 
                  type="file" accept="image/*" className="hidden" id="logo-upload"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = ev => setLocalSettings(prev => ({...prev, logoUrl: ev.target?.result as string}));
                      r.readAsDataURL(f);
                    }
                  }}
                />
                <Button variant="secondary" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>Nieuw Logo</Button>
             </div>
          </Card>

          <div className="lg:col-span-2 space-y-8">
            <Card padding="xl" className="space-y-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2 pt-2"><Building2 size={20} className="text-indigo-600" /> Algemene Informatie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Bedrijfsnaam" value={localSettings.name} onChange={e => setLocalSettings({...localSettings, name: e.target.value})} />
                <Input label="Contact Email" type="email" value={localSettings.email} onChange={e => setLocalSettings({...localSettings, email: e.target.value})} />
                <Input label="Telefoon" value={localSettings.phone} onChange={e => setLocalSettings({...localSettings, phone: e.target.value})} />
                <Input label="Hoofdkantoor" as="textarea" rows={1} value={localSettings.address} onChange={e => setLocalSettings({...localSettings, address: e.target.value})} />
              </div>
            </Card>

            <Card padding="xl" className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Transport Order Template</h3>
              <p className="text-xs text-[var(--muted-foreground)] font-medium leading-relaxed bg-[var(--muted)]/50 p-4 rounded-2xl border border-border">
                Gebruik tags: <code className="text-indigo-600 dark:text-indigo-400 font-bold">{"{reference}"}</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">{"{supplierName}"}</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">{"{loadingCity}"}</code>, <code className="text-indigo-600 dark:text-indigo-400 font-bold">{"{palletCount}"}</code>
              </p>
              <Input as="textarea" rows={12} className="font-mono text-xs leading-relaxed" value={localSettings.transportTemplate} onChange={e => setLocalSettings({...localSettings, transportTemplate: e.target.value})} />
              <div className="flex justify-end">
                <Button type="submit">Instellingen Opslaan</Button>
              </div>
            </Card>
          </div>
        </form>
      )}

      {currentSegment === 'users' && isAdmin && <UserManagement embedded={true} />}

      {currentSegment === 'documents' && isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {(['container', 'exworks'] as const).map(type => (
            <div key={type} className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                  {type === 'container' ? 'Zeevracht' : 'Wegtransport'}
                </h3>
                <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />} onClick={() => addDocument(type)}>Document</Button>
              </div>
              <div className="space-y-3">
                {docSettings[type]?.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-card border border-border p-4 rounded-2xl group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--muted)] rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs">{i + 1}</div>
                      <div>
                        <p className="font-bold text-foreground">{doc.name}</p>
                        <Badge variant={doc.required ? 'warning' : 'info'} size="xs">{doc.required ? 'Verplicht' : 'Optioneel'}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => toggleRequired(type, i)} className="p-2 text-[var(--muted-foreground)] hover:text-indigo-600 transition-colors"><Plus size={16} /></button>
                       <button onClick={() => removeDoc(type, i)} className="p-2 text-[var(--muted-foreground)] hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="col-span-full pt-10 border-t border-border flex justify-center">
            <Button onClick={handleSaveDocuments}>Documentinstellingen Vastleggen</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
