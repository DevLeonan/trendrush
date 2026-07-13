// src/app/dashboard/products/page.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface ProductImage {
  id: string;
  url: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  comparePrice: number | null;
  description: string;
  stock: number;
  images: ProductImage[];
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Gerenciamento do Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Dados do formulário de edição
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editComparePrice, setEditComparePrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Carregar produtos cadastrados (Buscando da rota correta /api/products)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/products');
      const data = await res.json();
      
      // Ajuste de segurança: a API retorna um array direto
      if (res.ok && Array.isArray(data)) {
        setProducts(data);
      } else {
        setError(data.error || 'Erro ao carregar produtos.');
      }
    } catch (err) {
      setError('Erro de rede ao buscar produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Abrir modal com dados pré-preenchidos para edição
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditPrice(product.price.toString());
    setEditComparePrice(product.comparePrice ? product.comparePrice.toString() : '');
    setEditDescription(product.description || '');
    setEditStock(product.stock ? product.stock.toString() : '0');
    setEditImages(product.images ? product.images.map((img) => img.url) : []);
    setIsEditModalOpen(true);
  };

  // Salvar as edições do produto (Integrado com /api/products/[id])
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          price: parseFloat(editPrice) || 0,
          comparePrice: editComparePrice ? parseFloat(editComparePrice) : null,
          description: editDescription,
          stock: parseInt(editStock) || 0,
          images: editImages, // Envia o array de strings conforme esperado pelo PUT
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Atualiza a lista local sem forçar recarregamento de página
        setProducts(products.map((p) => (p.id === editingProduct.id ? data : p)));
        setIsEditModalOpen(false);
        setEditingProduct(null);
      } else {
        alert(data.error || 'Erro ao salvar alterações.');
      }
    } catch (err) {
      alert('Erro ao tentar atualizar o produto.');
    }
  };

  // Excluir produto do banco (Integrado com /api/products/[id])
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto? Esta ação não pode ser desfeita.')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(data.error || 'Erro ao excluir o produto.');
      }
    } catch (err) {
      alert('Erro de comunicação para exclusão.');
    }
  };

  // Gerenciamento dinâmico de URLs de imagem
  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setEditImages([...editImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImageUrl = (index: number) => {
    setEditImages(editImages.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Gerenciamento de Produtos</h1>
            <p className="text-neutral-400 text-sm mt-1">
              Visualize, edite preços, descrições e mude as imagens importadas do CJ Dropshipping.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/products/new'}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#00F2EA] to-[#FF0050] text-black hover:opacity-90 transition-all duration-200 shadow-md shadow-cyan-900/10"
          >
            + Adicionar via CJ Link
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800/80 text-red-300 p-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#00F2EA] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10 backdrop-blur-sm">
            <p className="text-neutral-400 mb-4 text-sm">Nenhum produto cadastrado no banco SQLite.</p>
            <button
              onClick={() => window.location.href = '/dashboard/products/new'}
              className="px-4 py-2 text-xs font-semibold bg-neutral-900 border border-neutral-700 text-white hover:bg-neutral-800 rounded-md transition-all"
            >
              Fazer Primeira Importação
            </button>
          </div>
        ) : (
          /* Grid de Exibição dos Produtos */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden hover:border-[#00F2EA]/50 hover:bg-neutral-900/60 transition-all duration-300 flex flex-col backdrop-blur-md"
              >
                {/* Imagem de destaque */}
                <div className="aspect-square w-full relative bg-neutral-950/50 flex items-center justify-center overflow-hidden border-b border-neutral-800">
                  {product.images?.[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt={product.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-xs text-neutral-600">Sem imagens</span>
                  )}
                  {product.stock <= 5 && (
                    <span className="absolute top-3 left-3 bg-[#FF0050]/90 text-[10px] uppercase font-bold text-white px-2 py-0.5 rounded-full tracking-wide">
                      Estoque Baixo
                    </span>
                  )}
                </div>

                {/* Conteúdo Informativo */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2 text-neutral-100 group-hover:text-white transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-[#00F2EA] text-sm">
                        R$ {product.price.toFixed(2)}
                      </span>
                      {product.comparePrice && (
                        <span className="text-xs text-neutral-500 line-through">
                          R$ {product.comparePrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">Estoque: {product.stock} un</p>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-800/60">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="flex-1 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-1.5 rounded bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800 text-neutral-400 hover:text-red-400 text-xs font-semibold transition-all"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Edição (Glassmorphic Interface) */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0b0b0e] border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl shadow-cyan-900/10">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-800 mb-6">
                <h2 className="text-xl font-bold">Editar Detalhes do Produto</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                    Título do Produto
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                      Preço de Venda (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                      Preço Comparativo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editComparePrice}
                      onChange={(e) => setEditComparePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                      Estoque Físico
                    </label>
                    <input
                      type="number"
                      required
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all resize-y text-xs"
                  />
                </div>

                {/* Seção de Mídia e Imagens Externas */}
                <div className="border-t border-neutral-800 pt-5">
                  <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                    Imagens do Produto (URLs do CJ ou Servidor)
                  </label>
                  
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Cole a URL da nova imagem aqui"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-xs font-semibold hover:bg-neutral-700 transition-colors"
                    >
                      + Inserir
                    </button>
                  </div>

                  {/* Thumbnail de Previsualização */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[160px] overflow-y-auto pr-1">
                    {editImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        className="group relative aspect-square rounded-lg border border-neutral-800 overflow-hidden bg-black flex items-center justify-center"
                      >
                        <img src={imgUrl} alt={`Previa ${index}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageUrl(index)}
                          className="absolute inset-0 bg-red-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-red-300 font-semibold transition-opacity duration-150"
                        >
                          Remover 🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações Finais do Modal */}
                <div className="flex gap-3 justify-end pt-5 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-neutral-950 hover:bg-neutral-900 text-xs text-neutral-400 transition-colors"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00F2EA] to-[#FF0050] text-black text-xs font-bold transition-all hover:opacity-90"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}