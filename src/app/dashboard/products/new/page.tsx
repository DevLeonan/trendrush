'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();
  
  const [cjId, setCjId] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '', // <- O banco exige isso preenchido!
    price: '',
    comparePrice: '',
    costPrice: '',
    category: 'Geral',
    stock: '',
    imageUrl: '',
    supplierUrl: '' 
  });
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLER: PUXAR DADOS DO CJ (AUTO-FILL)
  // ==========================================
  const handleImport = async () => {
    if (!cjId) return alert('Cole o link do CJ Dropshipping primeiro.');
    
    setImportLoading(true);
    try {
      const response = await fetch('/api/products/import-cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cjProductId: cjId.trim() })
      });
      const data = await response.json();
      
      if (data.success) {
        setFormData({
          title: data.product.title,
          description: data.product.description || 'Produto incrível de alta conversão.', // Garante que nunca vá vazio
          price: data.product.price ? data.product.price.toFixed(2) : '',
          comparePrice: data.product.price ? (data.product.price * 1.3).toFixed(2) : '',
          costPrice: data.product.costPrice ? data.product.costPrice.toFixed(2) : '',
          category: data.product.category,
          stock: data.product.stock.toString(),
          imageUrl: data.product.imageUrl,
          supplierUrl: data.product.supplierUrl
        });
        alert('✅ Imagens e dados carregados! Agora traduza o nome, ajuste a descrição e o preço abaixo.');
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err) {
      alert('Erro de rede ao puxar produto.');
    } finally {
      setImportLoading(false);
    }
  };

  // ==========================================
  // HANDLER: SALVAR NO BANCO DE DADOS
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // SANITIZAÇÃO DE VÍRGULAS (ex: 99,90 -> 99.90)
    const safePrice = parseFloat(String(formData.price).replace(',', '.')) || 0;
    const safeCompare = formData.comparePrice ? parseFloat(String(formData.comparePrice).replace(',', '.')) : null;
    const safeCost = parseFloat(String(formData.costPrice).replace(',', '.')) || 0;
    const safeStock = parseInt(String(formData.stock), 10) || 0;

    if (safePrice === 0) {
      alert("Erro: O Preço de Venda Final não pode ser zero.");
      setLoading(false);
      return;
    }

    if (!formData.description) {
      alert("Erro: A Descrição do produto é obrigatória.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description, // Enviando a descrição pro banco
          price: safePrice,
          comparePrice: safeCompare,
          costPrice: safeCost,
          category: formData.category,
          stock: safeStock,
          images: [formData.imageUrl],
          supplierUrl: formData.supplierUrl 
        })
      });

      if (response.ok) {
        alert('Produto publicado na vitrine com sucesso!');
        router.push('/dashboard');
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.error}`);
      }
    } catch (err) {
      alert('Erro de conexão ao salvar produto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-8 pt-24">
      <div className="max-w-2xl mx-auto space-y-10">
        
        {/* MÓDULO CJ DROPSHIPPING */}
        <div className="bg-zinc-900/60 border border-brand-cyan/30 p-8 rounded-3xl shadow-[0_0_20px_rgba(0,242,234,0.05)]">
          <h2 className="text-2xl font-black mb-2 text-white">⚡ Importação Expressa</h2>
          <p className="text-sm text-zinc-400 mb-6">Puxe imagens e estrutura direto da China.</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Cole o link completo do produto no CJ..."
              value={cjId}
              onChange={(e) => setCjId(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-brand-cyan transition-colors"
            />
            <button 
              onClick={handleImport}
              disabled={importLoading}
              className="bg-brand-cyan text-black font-black px-8 py-4 rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {importLoading ? 'PUXANDO...' : 'CARREGAR DADOS'}
            </button>
          </div>
        </div>

        {/* MÓDULO MANUAL / EDIÇÃO */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl">
          <h1 className="text-3xl font-black mb-6 bg-gradient-to-r from-white to-brand-cyan bg-clip-text text-transparent">
            Revisar e Publicar Produto
          </h1>
          
          {formData.supplierUrl && (
            <div className="p-4 mb-6 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl flex items-center gap-3">
               <span className="text-brand-cyan text-xl">🔗</span>
               <p className="text-sm text-brand-cyan/80">
                 Produto vinculado ao fornecedor automático. (ID CJ: <span className="font-mono font-bold text-brand-cyan">{formData.supplierUrl}</span>)
               </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs text-zinc-400 font-bold block mb-2 uppercase">Nome (Traduza para o Português)</label>
              <input 
                type="text" 
                required 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-brand-cyan transition-colors" 
              />
            </div>

            {/* ✅ CAMPO DE DESCRIÇÃO RESTAURADO! */}
            <div>
              <label className="text-xs text-zinc-400 font-bold block mb-2 uppercase">Descrição (HTML ou Texto)</label>
              <textarea 
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-brand-cyan transition-colors" 
                placeholder="Descreva os benefícios e gatilhos mentais do produto..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-2 uppercase">Custo Base</label>
                <input 
                  type="text"
                  required
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-white outline-none focus:border-brand-cyan" 
                />
              </div>
              <div>
                <label className="text-xs text-brand-cyan font-bold block mb-2 uppercase">Venda Final (R$)</label>
                <input 
                  type="text"
                  required 
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-zinc-950 border border-brand-cyan/50 rounded-xl p-3 text-white outline-none focus:border-brand-cyan" 
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-2 uppercase">Riscado (Falso)</label>
                <input 
                  type="text"
                  value={formData.comparePrice}
                  onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-white outline-none focus:border-brand-cyan" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-2 uppercase">Categoria</label>
                <input 
                  type="text" 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-white outline-none focus:border-brand-cyan" 
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-bold block mb-2 uppercase">Estoque</label>
                <input 
                  type="number" 
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-brand-cyan" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 font-bold block mb-2 uppercase">URL da Imagem de Alta Qualidade</label>
              <input 
                type="text" 
                required 
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-brand-cyan text-sm" 
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-xl bg-brand-cyan text-black font-black hover:scale-[1.01] transition-transform duration-200 disabled:opacity-50"
            >
              {loading ? 'SALVANDO...' : 'PUBLICAR PRODUTO NA VITRINE'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}