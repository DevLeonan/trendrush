'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/'; // Para onde ele vai depois de logar

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Sistema de "Passwordless" (Sem senha). Em CRO, isso converte mais. 
  // Na prática, você enviaria um código pro email. Aqui vamos simular o login/cadastro automático pelo e-mail.
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Chama nossa API para gerar o cookie do cliente
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        // Redireciona de volta direto pro checkout!
        router.push(redirectUrl);
        router.refresh(); 
      }
    } catch (err) {
      alert('Erro ao processar identificação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 p-10 rounded-3xl backdrop-blur-xl shadow-2xl">
        
        <h1 className="text-3xl font-black mb-2 text-white text-center">Identifique-se</h1>
        <p className="text-zinc-400 text-center mb-8 text-sm">
          Para garantir a segurança do seu pedido, insira seu e-mail abaixo.
        </p>

        <form onSubmit={handleIdentify} className="space-y-6">
          <div>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-center text-lg outline-none focus:border-brand-cyan transition-colors"
            />
          </div>

          <button
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-pink text-black font-black hover:scale-[1.02] transition-transform duration-200 disabled:opacity-50"
          >
            {loading ? 'PROCESSANDO...' : 'CONTINUAR PARA O PAGAMENTO'}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Seus dados estão protegidos com criptografia de ponta a ponta.
        </p>
      </div>
    </div>
  );
}