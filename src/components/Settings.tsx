import React, { useState, useEffect } from 'react';
import { useSocket } from '../SocketContext';
import { toast } from 'sonner';
import { Building2, Plus, Trash2, Settings as SettingsIcon, AlertCircle, CheckCircle } from 'lucide-react';
import UserManagement from './UserManagement';
import { Input } from './shared/Input';
import { Button } from './shared/Button';
import { Card } from './shared/Card';
import { Badge } from './shared/Badge';
import { cn } from '../lib/utils';

const SettingsPage = ({ currentSegment = 'company' }: { currentSegment?: 'company' | 'users' | 'documents' | 'notifications' | 'security' }) => {
  const { state, dispatch, currentUser } = useSocket();
  const isAdmin = currentUser.role === 'admin';

  const [localSettings, setLocalSettings] = useState(state?.companySettings || {
    name: 'ILG Foodgroup',
    email: 'info@ilg-foodgroup.nl',
    phone: '+31 (0)88 000 0000',
    address: 'Voorbeeldstraat 1, 1234 AB, Nederland',
    logoUrl: '/logo.jfif',
    transportTemplate: `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
  <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Transport Opdracht: {reference}</h2>
  <p>Geachte transportpartner,</p>
  <p>Hierbij verstrekken wij u de opdracht voor het afhalen en leveren van de volgende zending:</p>
  
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
    <tr style="background-color: #f3f4f6;">
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 35%;">Onderdeel</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Gegevens</th>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Referentie / PO</td>
      <td style="padding: 10px; border: 1px solid #ddd;">{reference}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Leverancier / Klant</td>
      <td style="padding: 10px; border: 1px solid #ddd;">{supplierName}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Laadlocatie</td>
      <td style="padding: 10px; border: 1px solid #ddd;">{loadingCity}, {loadingCountry}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Aantal Pallets</td>
      <td style="padding: 10px; border: 1px solid #ddd;">{palletCount}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Totaal Gewicht</td>
      <td style="padding: 10px; border: 1px solid #ddd;">{weight} kg</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Incoterm</td>
      <td style="padding: 10px; border: 1px solid #ddd;">{incoterm}</td>
    </tr>
    <tr style="background-color: #f3f4f6;">
      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Transportkosten</td>
      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #ea580c;">€ {transportCost}</td>
    </tr>
  </table>

  <p style="margin-top: 24px;">Graag ontvangen wij een spoedige bevestiging van deze opdracht inclusief de verwachte laadtijd.</p>
  <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Met vriendelijke groet,<br/><strong style="color:#333;">YMS Logistics Planning</strong></p>
</div>`
  });

  const [docSettings, setDocSettings] = useState(state?.settings?.shipment_settings || { container: [], container_swb: [], exworks: [] });
  const [newDoc, setNewDoc] = useState<{ name: string; required: boolean; blocksMilestone: number; type: 'container' | 'container_swb' | 'exworks' | null }>({ name: '', required: false, blocksMilestone: 100, type: null });

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
    toast.success('Documentinstellingen opgeslagen');
  };

  const addDocument = (type: 'container' | 'container_swb' | 'exworks') => {
    if (!newDoc.name) return;
    setDocSettings({ 
      ...docSettings, 
      [type]: [...docSettings[type], { name: newDoc.name, required: newDoc.required, blocksMilestone: newDoc.blocksMilestone }] 
    });
    setNewDoc({ name: '', required: false, blocksMilestone: 100, type: null });
  };

  const toggleRequired = (type: 'container' | 'container_swb' | 'exworks', index: number) => {
    const newList = [...docSettings[type]];
    newList[index] = { ...newList[index], required: !newList[index].required };
    setDocSettings({ ...docSettings, [type]: newList });
  };

  const removeDoc = (type: 'container' | 'container_swb' | 'exworks', index: number) => {
    const newList = [...docSettings[type]];
    newList.splice(index, 1);
    setDocSettings({ ...docSettings, [type]: newList });
  };

  const MILESTONE_OPTIONS = {
    container: [
      { label: 'DOUANE (40)', value: 40 },
      { label: 'In Transit (50)', value: 50 },
      { label: 'Aankomst (75)', value: 75 },
      { label: 'Ingecheckt (100)', value: 100 },
    ],
    container_swb: [
      { label: 'DOUANE (40)', value: 40 },
      { label: 'In Transit (50)', value: 50 },
      { label: 'Aankomst (75)', value: 75 },
      { label: 'Ingecheckt (100)', value: 100 },
    ],
    exworks: [
      { label: 'Transport Order (25)', value: 25 },
      { label: 'In Transit (50)', value: 50 },
      { label: 'Aankomst (75)', value: 75 },
      { label: 'Ingecheckt (100)', value: 100 },
    ]
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
              {currentSegment === 'company' ? 'Organisatie' : 
               currentSegment === 'users' ? 'Team' : 
               currentSegment === 'documents' ? 'Documenten' :
               currentSegment === 'notifications' ? 'Notificaties & Alerts' : 'Beveiliging & Rollen'}
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
                <Input label="Hoofdkantoor" value={localSettings.address} onChange={e => setLocalSettings({...localSettings, address: e.target.value})} />
                <Input label="KvK Nummer" value={localSettings.kvk || ''} onChange={e => setLocalSettings({...localSettings, kvk: e.target.value})} />
                <Input label="BTW Nummer" value={localSettings.btw || ''} onChange={e => setLocalSettings({...localSettings, btw: e.target.value})} />
                
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-6 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Default Incoterm (Zeevracht)</label>
                    <select className="w-full p-3 bg-[var(--muted)] border-border rounded-xl text-sm font-bold"
                            value={state.settings?.default_incoterms?.container || ''}
                            onChange={e => dispatch('SAVE_SETTING', { key: 'default_incoterms', value: { ...state.settings?.default_incoterms, container: e.target.value }})}>
                      <option value="">- Geen -</option>
                      <option value="FOB">FOB</option>
                      <option value="CIF">CIF</option>
                      <option value="EXW">EXW</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">Default Incoterm (Wegtransport)</label>
                    <select className="w-full p-3 bg-[var(--muted)] border-border rounded-xl text-sm font-bold"
                            value={state.settings?.default_incoterms?.exworks || ''}
                            onChange={e => dispatch('SAVE_SETTING', { key: 'default_incoterms', value: { ...state.settings?.default_incoterms, exworks: e.target.value }})}>
                      <option value="">- Geen -</option>
                      <option value="FCA">FCA</option>
                      <option value="CIP">CIP</option>
                      <option value="EXW">EXW</option>
                    </select>
                  </div>
                </div>
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

      {currentSegment === 'notifications' && isAdmin && (
        <div className="space-y-8">
           <Card padding="xl" className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Systeem Notificaties (Banners/Toasts)</h3>
              <p className="text-sm text-[var(--muted-foreground)]">Kies bij welke processtappen gebruikers een actieve pop-up melding in de applicatie moeten ontvangen.</p>
              
              <div className="space-y-3 pt-4 border-t border-border">
                {['gateIn', 'telexRelease', 'customsClearance'].map((key) => (
                  <div key={key} className="flex items-center gap-3 p-4 bg-[var(--muted)]/50 rounded-2xl border border-border">
                    <input 
                      type="checkbox" 
                      id={`notif-${key}`}
                      checked={state.settings?.notification_triggers?.[key as keyof typeof state.settings.notification_triggers] || false}
                      onChange={e => dispatch('SAVE_SETTING', { 
                        key: 'notification_triggers', 
                        value: { ...state.settings?.notification_triggers, [key]: e.target.checked }
                      })}
                      className="w-5 h-5 rounded-md border-border text-indigo-600 focus:ring-indigo-500" 
                    />
                    <label htmlFor={`notif-${key}`} className="text-sm font-bold text-foreground cursor-pointer">
                      {key === 'gateIn' ? 'Aankomst Poort (Gate-In)' : key === 'telexRelease' ? 'Telex Vrijgave' : 'Douane Inklaring (MRN Cleared)'}
                    </label>
                  </div>
                ))}
              </div>
           </Card>

           <Card padding="xl" className="space-y-6">
             <h3 className="text-xl font-bold text-foreground">Waarschuwingsdrempels</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input 
                 label="Wachttijd Alert (minuten)" 
                 type="number"
                 value={state.settings?.alert_thresholds?.queueWaitMinutes || 60}
                 onChange={e => dispatch('SAVE_SETTING', { 
                   key: 'alert_thresholds', 
                   value: { ...state.settings?.alert_thresholds, queueWaitMinutes: parseInt(e.target.value) || 60 }
                 })}
               />
               <Input 
                 label="Demurrage Waarschuwing (dagen vooraf)" 
                 type="number"
                 value={state.settings?.alert_thresholds?.demurrageWarningDays || 3}
                 onChange={e => dispatch('SAVE_SETTING', { 
                   key: 'alert_thresholds', 
                   value: { ...state.settings?.alert_thresholds, demurrageWarningDays: parseInt(e.target.value) || 3 }
                 })}
               />
             </div>
           </Card>
        </div>
      )}

      {currentSegment === 'security' && isAdmin && (
        <div className="space-y-8">
           <Card padding="xl" className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Rollen & Sessiebeheer</h3>
              <p className="text-sm text-[var(--muted-foreground)]">Configureer timeouts en landingspagina's per rol.</p>

              <div className="space-y-4 pt-4 border-t border-border">
                {['admin', 'manager', 'staff', 'operator', 'lead_operator', 'finance_auditor', 'viewer'].map(role => (
                  <div key={role} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm">
                    <div className="flex-1">
                      <p className="font-bold text-foreground capitalize">{role.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] block mb-1">Startpagina</label>
                        <select 
                          className="p-2 bg-[var(--muted)] border border-border rounded-xl text-sm font-bold min-w-[150px] outline-none"
                          value={state.settings?.role_settings?.[role as any]?.defaultPage || 'dashboard'}
                          onChange={e => dispatch('SAVE_SETTING', {
                            key: 'role_settings',
                            value: { ...state.settings?.role_settings, [role]: { ...state.settings?.role_settings?.[role as any], defaultPage: e.target.value } }
                          })}
                        >
                          <option value="dashboard">Dashboard</option>
                          <option value="deliveries">Pipeline</option>
                          <option value="yms-arrivals">YMS aankomst</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] block mb-1">Timeout (min)</label>
                        <input 
                          type="number"
                          className="p-2 bg-[var(--muted)] border border-border rounded-xl text-sm font-bold w-24 outline-none"
                          value={state.settings?.role_settings?.[role as any]?.sessionTimeout || 60}
                          onChange={e => dispatch('SAVE_SETTING', {
                            key: 'role_settings',
                            value: { ...state.settings?.role_settings, [role]: { ...state.settings?.role_settings?.[role as any], sessionTimeout: parseInt(e.target.value) || 60 } }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
           </Card>
        </div>
      )}


      {currentSegment === 'documents' && isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {(['container', 'container_swb', 'exworks'] as const).map(type => (
            <div key={type} className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                  {type === 'container' ? 'Zeevracht (B/L)' : type === 'container_swb' ? 'Zeevracht (SWB)' : 'Wegtransport'}
                </h3>
              </div>

              {/* Add Document Inline Form */}
              <div className="bg-card/50 border border-indigo-500/20 p-4 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                   <Input 
                     placeholder="Documentnaam (bijv. ATR)" 
                     value={newDoc.type === type ? newDoc.name : ''} 
                     onChange={e => setNewDoc({ ...newDoc, name: e.target.value, type })}
                     containerClassName="flex-1"
                   />
                   <Button size="sm" onClick={() => addDocument(type)} disabled={newDoc.type !== type || !newDoc.name}>Toevoegen</Button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                     <input 
                       type="checkbox" 
                       id={`req-${type}`}
                       checked={newDoc.type === type ? newDoc.required : false} 
                       onChange={e => setNewDoc({ ...newDoc, required: e.target.checked, type })}
                       className="w-4 h-4 rounded border-border text-indigo-600"
                     />
                     <label htmlFor={`req-${type}`} className="text-xs font-bold text-foreground">Verplicht</label>
                  </div>
                  <div className="flex-1">
                    <select 
                      className="w-full p-2 bg-[var(--muted)] border-border rounded-xl text-[10px] font-bold"
                      value={newDoc.type === type ? newDoc.blocksMilestone : 100}
                      onChange={e => setNewDoc({ ...newDoc, blocksMilestone: parseInt(e.target.value), type })}
                    >
                      {MILESTONE_OPTIONS[type].map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {docSettings[type]?.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-card border border-border p-4 rounded-2xl group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[var(--muted)] rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs">{i + 1}</div>
                      <div>
                        <p className="font-bold text-foreground">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={doc.required ? 'warning' : 'info'} size="xs">{doc.required ? 'Verplicht' : 'Optioneel'}</Badge>
                          {doc.required && (
                            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-tighter">
                              Blokkeert {MILESTONE_OPTIONS[type].find(o => o.value === doc.blocksMilestone)?.label || doc.blocksMilestone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => toggleRequired(type, i)} className={cn("p-2 transition-colors", doc.required ? "text-amber-500" : "text-[var(--muted-foreground)] hover:text-indigo-600")}>
                         {doc.required ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                       </button>
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
