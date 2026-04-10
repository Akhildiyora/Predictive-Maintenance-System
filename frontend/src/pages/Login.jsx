import React, { useState } from 'react';
import { Cloud, Lock, Mail, ArrowRight } from 'lucide-react';
import { BACKEND_URL } from '../config';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || 'Identity verification failed');
      }
    } catch (err) {
      setError('Network synchronization error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-lowest p-6">
      <div className="layer-1 w-full max-w-md p-10 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30">
            <Cloud className="text-primary" size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PREDICT.AI</h1>
          <p className="text-on-surface-variant text-sm mt-1">Industrial Intelligence Gateway</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1">Control Credentials</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input 
                type="email" 
                placeholder="Engineer Email"
                className="w-full bg-surface-low border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all placeholder:text-white/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input 
                type="password" 
                placeholder="Access Key"
                className="w-full bg-surface-low border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:border-primary outline-none transition-all placeholder:text-white/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
             <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center">
               {error}
             </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-kinetic group"
          >
            <span>{loading ? 'Authenticating...' : 'Engage Interface'}</span>
            {!loading && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-on-surface-variant">
          Unauthorized access is strictly monitored.
        </p>
      </div>
    </div>
  );
}
