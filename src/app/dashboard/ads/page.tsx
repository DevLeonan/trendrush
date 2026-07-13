'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AdControlDashboard() {
  const [platform, setPlatform] = useState('TikTok Ads');
  const [spend, setSpend] = useState('');
  const [loading, setLoading] = useState(false);

  // Simulação de métricas gerais (Isso viria de um Server Component via props na prática)
  const metrics = {
    revenue: 12450.00,
    costOfGoods: 3100.00,
    totalAdSpend: 1850.00,
  };

  const netProfit = metrics.revenue - metrics.costOfGoods - metrics.totalAdSpend;
  const roi = ((metrics.revenue - metrics.totalAdSpend) / metrics.totalAdSpend) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Aqui você chamaria a rota da API (ex: POST /api/ads)
    await new Promise(resolve => setTimeout(resolve, 800)); 
    setSpend('');
    setLoading(false);
    alert('Investimento registrado com sucesso!');
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-8 font-sans">
      
      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
          AD CONTROL & ROI
        </h1>
        <p className="text-gray-400 mt-2">Gestão de tráfego e conversão máxima.</p>
      </header>

      {/* Cards de Métricas - Estilo Apple/Vercel (Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_15px_rgba(0,242,234,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F2EA] rounded-full blur-[80px] opacity-20 -z-10" />
          <h3 className="text-gray-400 font-medium">Faturamento Hoje</h3>
          <p className="text-3xl font-black mt-2">R$ {metrics.revenue.toFixed(2)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_15px_rgba(255,0,80,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF0050] rounded-full blur-[80px] opacity-20 -z-10" />
          <h3 className="text-gray-400 font-medium">Lucro Líquido</h3>
          <p className="text-3xl font-black mt-2 text-[#00F2EA]">R$ {netProfit.toFixed(2)}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden"
        >
          <h3 className="text-gray-400 font-medium">ROI Global</h3>
          <p className="text-3xl font-black mt-2">{roi.toFixed(1)}%</p>
        </motion.div>
      </div>

      {/* Formulário de Inserção de Custos */}
      <div className="max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-6">Registrar Investimento</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400 font-medium">Plataforma</label>
            <select 
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="bg-[#050507] border border-white/20 text-white rounded-xl p-3 focus:outline-none focus:border-[#FF0050] transition-colors"
            >
              <option value="TikTok Ads">TikTok Ads</option>
              <option value="Meta Ads">Meta Ads (FB/IG)</option>
              <option value="Google Ads">Google Ads</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400 font-medium">Valor Investido (R$)</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
              className="bg-[#050507] border border-white/20 text-white rounded-xl p-3 focus:outline-none focus:border-[#00F2EA] transition-colors placeholder-gray-600"
              placeholder="Ex: 150.00"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="mt-4 bg-gradient-to-r from-[#FF0050] to-[#00F2EA] text-white font-black tracking-wider py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'REGISTRANDO...' : 'SALVAR INVESTIMENTO'}
          </button>
        </form>
      </div>
    </div>
  );
}