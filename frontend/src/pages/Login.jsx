import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, User, ShieldAlert, Cpu } from 'lucide-react';
import { BACKEND_URL } from '../config';

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isSignup ? '/auth/signup' : '/auth/login';
    const payload = isSignup 
      ? { email, password, full_name: fullName } 
      : { email, password };

    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    <div className="relative min-h-screen flex items-center justify-center p-3 bg-[#050608] overflow-hidden font-sans">
      {/* Cinematic Perspective Background */}
      <img 
        src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2070" 
        alt="Industrial Neural Gateway" 
        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.2] contrast-125 saturate-150 transform scale-110 animate-pulse transition-all duration-[10s]"
      />
      
      {/* Dynamic Overlay Layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] z-0" />
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full z-0" />

      {/* High-Performance Access Panel */}
      <div className="relative z-20 w-full max-w-[440px] p-6 md:p-8 rounded-[64px] bg-[#0c0d0f]/60 backdrop-blur-3xl border border-white/10 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9)] animate-reveal">
        <div className="flex flex-col items-center mb-8 space-y-4">
          <div className="w-20 h-20 bg-blue-600/15 rounded-3xl flex items-center justify-center border border-blue-600/30 shadow-[0_0_50px_rgba(59,130,246,0.3)] group hover:scale-110 transition-transform duration-500 cursor-none">
            <Cpu className="text-blue-400 group-hover:animate-spin" size={40} />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase drop-shadow-2xl">PREDICT.AI</h1>
            <p className="text-sm font-black tracking-[0.15em] uppercase text-blue-500/60 pl-2">Security Level :: Alpha</p>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-blue-600/40 to-transparent rounded-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            {isSignup && (
              <div className="group relative flex items-center transition-all animate-reveal" style={{ animationDelay: '0.1s' }}>
                <div className="absolute left-6 text-blue-500/40 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="IDENTITY NAME"
                  className="w-full bg-white/2 border border-white/5 border-b-2 border-b-white/10 rounded-2xl py-3.5 pl-16 pr-8 text-white text-base font-bold tracking-normal focus:outline-none focus:bg-blue-600/5 focus:border-blue-600/40 focus:border-b-blue-500 transition-all placeholder:text-white/10 placeholder:text-sm placeholder:font-black placeholder:tracking-[0.1em]"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="group relative flex items-center transition-all animate-reveal" style={{ animationDelay: '0.2s' }}>
              <div className="absolute left-6 text-blue-500/40 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                placeholder="NETWORK EMAIL"
                className="w-full bg-white/2 border border-white/5 border-b-2 border-b-white/10 rounded-2xl py-3.5 pl-16 pr-8 text-white text-base font-bold tracking-normal focus:outline-none focus:bg-blue-600/5 focus:border-blue-600/40 focus:border-b-blue-500 transition-all placeholder:text-white/10 placeholder:text-sm placeholder:font-black placeholder:tracking-[0.1em]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="group relative flex items-center transition-all animate-reveal" style={{ animationDelay: '0.3s' }}>
              <div className="absolute left-6 text-blue-500/40 group-focus-within:text-blue-400 transition-colors pointer-events-none">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                placeholder="ACCESS KEY"
                className="w-full bg-white/2 border border-white/5 border-b-2 border-b-white/10 rounded-2xl py-3.5 pl-16 pr-8 text-white text-base font-bold tracking-normal focus:outline-none focus:bg-blue-600/5 focus:border-blue-600/40 focus:border-b-blue-500 transition-all placeholder:text-white/10 placeholder:text-sm placeholder:font-black placeholder:tracking-[0.1em]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
             <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-[0.1em] rounded-2xl text-center animate-reveal flex items-center justify-center gap-4">
               <ShieldAlert size={18} className="shrink-0" />
               <span>{error}</span>
             </div>
          )}

          <div className="flex flex-col gap-3 animate-reveal" style={{ animationDelay: '0.4s' }}>
            <button 
              type="submit" 
              disabled={loading}
              className="group relative w-full py-3.5 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center gap-4 text-blue-950 text-sm font-black uppercase tracking-[0.1em] overflow-hidden shadow-[0_15px_45px_-10px_rgba(59,130,246,0.4)] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span>{loading ? 'SYNCHRONIZING...' : (isSignup ? 'PROVISION ACCESS' : 'ENGAGE INTERFACE')}</span>
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>

            <button 
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="w-full py-3 rounded-2xl bg-white/2 border border-white/5 text-slate-500 text-sm font-black uppercase tracking-[0.1em] hover:bg-white/5 hover:text-white hover:border-white/10 transition-all"
            >
              {isSignup ? 'Return to Access Gate' : 'Provision New Identity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
