import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Shield, ShieldCheck, ShieldAlert, Copy, Check, RefreshCw, Smartphone, QrCode } from 'lucide-react';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { toast } from 'sonner';

export const AccountSettings = () => {
  const { currentUser } = useSocket();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/setup-2fa', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setIsSettingUp(true);
      } else {
        toast.error('Fout bij het genereren van de 2FA configuratie.');
      }
    } catch (err) {
      toast.error('Netwerkfout bij opzetten 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSetup = async () => {
    if (verificationCode.length !== 6) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/confirm-2fa', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ secret, code: verificationCode })
      });
      if (res.ok) {
        toast.success('Two-Factor Authentication succesvol ingeschakeld!');
        window.location.reload(); // Refresh to update user state
      } else {
        toast.error('Ongeldige verificatiecode.');
      }
    } catch (err) {
      toast.error('Netwerkfout bij bevestigen.');
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Weet u zeker dat u 2FA wilt uitschakelen? Uw account is dan minder goed beveiligd.')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/disable-2fa', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        toast.success('2FA uitgeschakeld.');
        window.location.reload();
      }
    } catch (err) {
      toast.error('Fout bij uitschakelen.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.info('Secret gekopieerd naar klembord');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex items-center gap-4">
        <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/20 text-white">
          <Shield size={32} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-4xl font-black text-foreground tracking-tight italic uppercase">Beveiliging</h2>
          <p className="text-[var(--muted-foreground)] mt-1 font-medium tracking-widest uppercase text-xs">Beheer de beveiliging van uw account en activeer extra bescherming.</p>
        </div>
      </header>

      <div className="max-w-4xl space-y-8">
        <Card padding="xl" className="relative overflow-hidden">
          {currentUser?.twoFactorEnabled && (
            <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-600 px-6 py-2 rounded-bl-3xl font-bold text-xs tracking-widest uppercase flex items-center gap-2 border-l border-b border-emerald-500/20">
              <ShieldCheck size={14} /> Beveiligd
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">Two-Factor Authentication (2FA)</h3>
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  Voeg een extra beveiligingslaag toe aan uw account. Naast uw wachtwoord is een verificatiecode van een app (zoals Authpoint of Google Authenticator) vereist om in te loggen.
                </p>
              </div>

              {!currentUser?.twoFactorEnabled && !isSettingUp && (
                <div className="bg-[var(--muted)]/50 p-6 rounded-3xl border border-border space-y-4">
                  <div className="flex items-center gap-4 text-emerald-600">
                    <Smartphone size={32} />
                    <p className="font-bold">Beveilig uw account met een mobiele app.</p>
                  </div>
                  <Button 
                    onClick={startSetup} 
                    isLoading={isLoading}
                    className="w-full md:w-auto"
                  >
                    2FA Nu Inschakelen
                  </Button>
                </div>
              )}

              {currentUser?.twoFactorEnabled && (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">TOTP Beveiliging Actief</p>
                    <p className="text-xs text-emerald-600/70 font-medium">Uw account is beveiligd met een tweede factor.</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={disable2FA} 
                    isLoading={isLoading}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20"
                  >
                    Uitschakelen
                  </Button>
                </div>
              )}
            </div>

            {isSettingUp && (
              <div className="w-full md:w-80 space-y-6 p-6 bg-[var(--muted)]/50 rounded-3xl border border-indigo-500/20 shadow-inner">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200">
                    {qrCode ? (
                      <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-slate-50">
                        <RefreshCw className="animate-spin text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground italic uppercase tracking-tight">Scan de code</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] font-bold">Gebruik uw authenticator app</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest pl-1">Handmatige Sleutel</label>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-border shadow-sm">
                      <code className="flex-1 text-[10px] font-mono font-bold truncate text-indigo-600 uppercase pr-2">{secret}</code>
                      <button onClick={copySecret} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500">
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest pl-1">Verificatiecode</label>
                    <input 
                      type="text" 
                      placeholder="000000"
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0,6))}
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-border rounded-2xl text-center text-2xl font-mono tracking-[0.3em] font-black focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setIsSettingUp(false)}>Annuleer</Button>
                    <Button 
                      className="flex-1" 
                      onClick={confirmSetup} 
                      disabled={verificationCode.length !== 6 || isLoading}
                      isLoading={isLoading}
                    >
                      Bevestigen
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card padding="xl" className="border-l-4 border-l-amber-500">
          <div className="flex gap-4">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shrink-0 h-fit">
              <ShieldAlert size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-foreground">Belangrijke informatie</h4>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Nadat u 2FA heeft ingeschakeld, kunt u alleen nog inloggen met een geldige code uit uw app. Indien u de toegang tot uw app verliest, dient u contact op te nemen met een Systeembeheerder om uw 2FA te laten resetten.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
