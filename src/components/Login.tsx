import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useSocket } from '../SocketContext';

export const Login = () => {
  const { login } = useSocket();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Ongeldige inloggegevens. Probeer het opnieuw.');
      }
    } catch (err) {
      setError('Er is een systeemfout opgetreden bij het inloggen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-900 px-8 py-10 flex flex-col items-center">
          <div className="bg-white p-2 rounded-lg mb-6 shadow-md">
            <img 
              src="/logo.jfif" 
              alt="ILG Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">ILG Foodgroup</h1>
          <p className="text-slate-400 text-sm font-medium">Logistics & Yard Management System v3.10.0</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Inloggen Portaal</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">E-mailadres</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  data-testid="login-email"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                  placeholder="naam@ilgfood.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">Wachtwoord</label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Wachtwoord vergeten?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  data-testid="login-password"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              data-testid="login-submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75"
            >
              {isLoading ? (
                <span>Wordt ingelogd...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Inloggen
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
            <span className="text-xs text-slate-500">
              Beveiligde toegang voor geautoriseerd personeel.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
