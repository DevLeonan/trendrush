// app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';

interface ProductImage {
  id: string;
  url: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  costPrice: number;
  category: string;
  stock: number;
  supplierUrl: string | null;
  images: ProductImage[];
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'products'>('metrics');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);

  // Estados do Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Campos do formulário de edição (mapeados estritamente com os tipos do seu SQLite/Prisma)
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editComparePrice, setEditComparePrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editSupplierUrl, setEditSupplierUrl] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // 1. Carrega os produtos da rota de API correta
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setErrorProducts(null);
      
      // Ajustado de '/api/admin/products' para '/api/products'
      const res = await fetch('/api/products');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Erro HTTP ${res.status}: Não foi possível carregar os produtos.`);
      }
      
      setProducts(data);
    } catch (err: any) {
      setErrorProducts(err.message || 'Não foi possível carregar a lista de produtos cadastrados.');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. Prepara e abre o modal de edição com os dados do SQLite
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditDescription(product.description || '');
    setEditPrice(product.price.toString());
    setEditComparePrice(product.comparePrice ? product.comparePrice.toString() : '');
    setEditCostPrice(product.costPrice ? product.costPrice.toString() : '');
    setEditCategory(product.category || '');
    setEditStock(product.stock.toString());
    setEditSupplierUrl(product.supplierUrl || '');
    setEditImages(product.images.map((img) => img.url));
    setIsEditModalOpen(true);
  };

  // 3. Envia os dados atualizados para a API PUT
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      // Ajustado de '/api/admin/products' para '/api/products'
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          price: parseFloat(editPrice) || 0,
          comparePrice: editComparePrice ? parseFloat(editComparePrice) : null,
          costPrice: parseFloat(editCostPrice) || 0,
          category: editCategory,
          stock: parseInt(editStock) || 0,
          supplierUrl: editSupplierUrl || null,
          images: editImages, // Array de strings (URLs)
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao processar atualização.');
      }

      const updatedData = await res.json();
      
      // Atualização do estado na tela
      setProducts(products.map((p) => (p.id === editingProduct.id ? updatedData : p)));
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar modificações do produto.');
    }
  };

  // 4. Dispara a exclusão para a API DELETE
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este produto do banco?')) return;

    try {
      // Ajustado de '/api/admin/products' para '/api/products'
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        const errData = await res.json();
        alert(errData.error || 'Erro ao deletar produto.');
      }
    } catch (err) {
      alert('Erro ao tentar se comunicar com o servidor.');
    }
  };

  // Gerenciador de URLs de imagem
  const handleAddImageUrl = () => {
    if (newImageUrl.trim() && !editImages.includes(newImageUrl.trim())) {
      setEditImages([...editImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImageUrl = (indexToRemove: number) => {
    setEditImages(editImages.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho do Painel */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-neutral-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Painel Executivo Real</h1>
            <p className="text-neutral-400 text-sm mt-1">
              Dados de performance em tempo real extraídos do SQLite.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/products/new'}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#00F2EA] to-[#FF0050] text-black hover:opacity-90 transition-all duration-200 shadow-md shadow-cyan-950/20"
          >
            + Adicionar Produto Real
          </button>
        </div>

        {/* Sistema de Abas */}
        <div className="flex gap-6 border-b border-neutral-800 pb-px mb-8">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'metrics'
                ? 'border-[#00F2EA] text-[#00F2EA]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Visão Geral / Métricas
          </button>
          <button
            onClick={() => {
              setActiveTab('products');
              fetchProducts(); // Dispara a listagem
            }}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'products'
                ? 'border-[#00F2EA] text-[#00F2EA]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Produtos Cadastrados ({products.length})
          </button>
        </div>

        {/* ABA 1: MÉTRICAS */}
        {activeTab === 'metrics' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 backdrop-blur-md">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Faturamento de Hoje
                </span>
                <p className="text-3xl font-bold mt-2">R$ 0,00</p>
              </div>

              <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 backdrop-blur-md">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Taxa de Conversão
                </span>
                <p className="text-3xl font-bold mt-2 text-[#00F2EA]">0.00%</p>
              </div>

              <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 backdrop-blur-md">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Investimento Total em Tráfego
                </span>
                <p className="text-3xl font-bold mt-2 text-[#FF0050]">R$ 0,00</p>
              </div>
            </div>

            <div className="bg-neutral-900/20 border border-neutral-800 rounded-xl p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold mb-4">Investimento de Mídia Integrada (Dados do Banco)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-500 uppercase text-[10px] tracking-wider">
                      <th className="pb-3 font-semibold">Campanha</th>
                      <th className="pb-3 font-semibold">Canal</th>
                      <th className="pb-3 font-semibold">Investimento</th>
                      <th className="pb-3 font-semibold">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-900/50 text-neutral-400">
                      <td className="py-4" colSpan={4}>
                        Nenhuma campanha de tráfego ativa encontrada no SQLite.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: LISTAGEM DE PRODUTOS */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            {errorProducts && (
              <div className="bg-red-950/40 border border-red-800/80 text-red-300 p-4 rounded-xl text-sm">
                {errorProducts}
              </div>
            )}

            {loadingProducts ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#00F2EA] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/10">
                <p className="text-neutral-400 text-sm mb-4">Nenhum produto cadastrado no banco SQLite.</p>
                <button
                  onClick={() => window.location.href = '/dashboard/products/new'}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 rounded-lg text-xs transition-all"
                >
                  Importar via CJ Dropshipping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-neutral-900/20 border border-neutral-800 rounded-xl overflow-hidden hover:border-[#00F2EA]/40 transition-all duration-300 flex flex-col backdrop-blur-md"
                  >
                    <div className="aspect-square bg-neutral-950/40 relative flex items-center justify-center overflow-hidden border-b border-neutral-800">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-xs text-neutral-600">Sem imagem</span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-neutral-200 line-clamp-2 min-h-[40px]">
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
                        <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-2">
                          <span>Estoque: {product.stock} un</span>
                          <span>Custo: R$ {product.costPrice?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-neutral-800/40">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="flex-1 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-2.5 py-1.5 rounded bg-neutral-950 border border-neutral-800 hover:border-red-800/60 hover:bg-red-950/10 text-neutral-400 hover:text-red-400 text-xs font-semibold transition-all"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL DE EDIÇÃO */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0b0b0e] border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-800 mb-6">
                <h2 className="text-lg font-bold">Configurações Gerais do Produto</h2>
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
                    Título do Produto (Usado no Front)
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Preço Comparativo (R$ - "De")
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editComparePrice}
                      onChange={(e) => setEditComparePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                      Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editCostPrice}
                      onChange={(e) => setEditCostPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                      Categoria do Produto
                    </label>
                    <input
                      type="text"
                      required
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                      Estoque Atual
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
                    ID CJ Dropshipping / URL Fornecedor
                  </label>
                  <input
                    type="text"
                    value={editSupplierUrl}
                    onChange={(e) => setEditSupplierUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                    Descrição Completa
                  </label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900/50 border border-neutral-800 focus:border-[#00F2EA]/70 focus:outline-none rounded-lg text-sm text-white transition-all resize-y text-xs"
                  />
                </div>

                {/* Sub-gerenciador de Imagens */}
                <div className="border-t border-neutral-800 pt-5">
                  <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                    Galeria de Imagens (URLs de CDN)
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
                      className="px-4 py-2 rounded-lg bg-neutral-850 border border-neutral-700 text-xs font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      Inserir
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[160px] overflow-y-auto pr-1">
                    {editImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        className="group relative aspect-square rounded-lg border border-neutral-800 overflow-hidden bg-black flex items-center justify-center"
                      >
                        <img src={imgUrl} alt={`Mídia ${index}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageUrl(index)}
                          className="absolute inset-0 bg-red-950/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-red-300 font-semibold transition-opacity duration-150"
                        >
                          Remover 🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controles do Modal */}
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