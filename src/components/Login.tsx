import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Truck, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSocket } from '../SocketContext';

export const Login = () => {
  const { login } = useSocket();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    setResetMessage('');
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setResetMessage(data.message);
      } else {
        setResetMessage(data.error);
      }
    } catch (err) {
      setResetMessage('Er is een fout opgetreden.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Ongeldig e-mailadres of wachtwoord');
      }
    } catch (err) {
      setError('Er is een fout opgetreden bij het inloggen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-6xl grid md:grid-cols-2 bg-card rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden min-h-[600px] border border-border">
        
        {/* Left Side - Form */}
        <div className="p-8 sm:p-14 flex flex-col justify-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full mx-auto"
          >
            <div className="flex items-center gap-3 mb-12">
              <img src="/logo.jfif" alt="ILG Logo" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-indigo-100 dark:shadow-indigo-900/40" />

              <span className="text-2xl font-black tracking-tight text-foreground">ILG Logistics & YMS Platform</span>
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-2 tracking-tight">Project Logistics & YMS</h1>
            <p className="text-[var(--muted-foreground)] mb-10 text-lg">Beheer je volledige supply chain en yard operaties.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-[var(--muted-foreground)] ml-4">E-mailadres</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="naam@ilgfood.com"
                    className="w-full pl-14 pr-6 py-4 bg-[var(--muted)]/50 border border-border rounded-full focus:ring-2 focus:ring-indigo-500 transition-shadow text-foreground font-medium outline-none dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <div className="flex justify-between items-center ml-4 mr-4">
                  <label className="text-sm font-bold text-[var(--muted-foreground)]">Wachtwoord</label>
                  <button type="button" onClick={() => setShowResetModal(true)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline transition-colors">Wachtwoord vergeten?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-14 pr-6 py-4 bg-[var(--muted)]/50 border border-border rounded-full focus:ring-2 focus:ring-indigo-500 transition-shadow text-foreground font-medium font-mono outline-none dark:bg-slate-800"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/40 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group mt-8 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
                {!isLoading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </motion.div>
          
          <div className="absolute bottom-8 left-14 text-sm font-bold text-[var(--muted-foreground)]/50 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            Beveiligde SSL Verbinding
          </div>
        </div>

        {/* Right Side - Visuals */}
        <div className="hidden md:flex bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-14 flex-col justify-between text-white relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold mb-8"
            >
              <Package size={16} />
              Supply Chain Portal
            </motion.div>
            <h2 className="text-5xl font-black mb-6 leading-tight">
              Volledige controle <br/>over je yard.
            </h2>
            <p className="text-indigo-100 text-lg max-w-md opacity-90 leading-relaxed">
              Van container tot dock: beheer naadloos je logistieke stromen en yard management.
            </p>
          </div>

          {/* Dashboard Preview Image */}
          <div className="relative z-10 w-full mt-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-2 shadow-2xl overflow-hidden">
            <img 
              src="/login-bg.png" 
              alt="YMS Monitor Preview" 
              className="w-full h-auto rounded-xl object-cover shadow-inner"
            />
          </div>
        </div>

      </div>
      
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-md" onClick={() => setShowResetModal(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-card border border-border rounded-3xl shadow-2xl p-8 max-w-sm w-full"
          >
            <h3 className="text-xl font-bold text-foreground mb-2">Wachtwoord Resetten</h3>
            <p className="text-[var(--muted-foreground)] text-sm mb-6">Vul je e-mailadres in om een tijdelijk wachtwoord te ontvangen.</p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="naam@ilgfood.com"
                className="w-full px-6 py-3 bg-[var(--muted)]/50 border border-border rounded-full focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-foreground outline-none dark:bg-slate-800"
              />
              
              {resetMessage && (
                <p className={`text-sm font-bold ${resetMessage.includes('gereset') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {resetMessage}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-3 hover:bg-[var(--muted)] text-[var(--muted-foreground)] font-bold rounded-full text-sm transition-colors">
                  Annuleren
                </button>
                <button type="submit" disabled={isResetting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-sm shadow-md shadow-indigo-100 dark:shadow-indigo-900/20 disabled:opacity-70 transition-all">
                  {isResetting ? 'Verzenden...' : 'Reset'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
