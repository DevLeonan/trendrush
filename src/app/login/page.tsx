'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh(); // Força o Next.js a atualizar os cookies no navegador
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_40px_rgba(0,242,234,0.05)]">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-white to-brand-cyan bg-clip-text text-transparent">
            Acesso Restrito
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Painel de Controle TrendRush</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs text-zinc-400 font-bold block mb-2 uppercase">E-mail Administrativo</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-brand-cyan transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-bold block mb-2 uppercase">Senha</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-brand-cyan transition-colors"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-brand-cyan text-black font-black hover:scale-[1.02] transition-transform duration-200 disabled:opacity-50 mt-4"
          >
            {loading ? 'AUTENTICANDO...' : 'ENTRAR NO SISTEMA'}
          </button>
        </form>
      </div>
    </div>
  );
}