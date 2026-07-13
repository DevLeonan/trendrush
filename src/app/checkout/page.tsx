// app/checkout/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const productIdFromUrl = searchParams.get('id');

  // Dados Dinâmicos do Produto Selecionado
  const [product, setProduct] = useState({
    id: productIdFromUrl || 'default-id',
    title: 'Corretor de Unha Encravada',
    price: 5.99,
    imageUrl: 'https://images.cjdropshipping.com/image.jpg' // Substitua por imagem padrão válida
  });

  // Estados dos Campos do Formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [cpf, setCpf] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');

  // Estados de Interface e Modal PIX
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; ticket_url: string } | null>(null);
  const [cardSuccess, setCardSuccess] = useState<string | null>(null);

  // 1. Efeito para carregar dinamicamente o produto real importado do seu SQLite
  useEffect(() => {
    if (productIdFromUrl) {
      fetch(`/api/products`)
        .then((res) => res.json())
        .then((data: any[]) => {
          const found = data.find((p) => p.id === productIdFromUrl);
          if (found) {
            setProduct({
              id: found.id,
              title: found.title,
              price: found.price,
              imageUrl: found.images?.[0]?.url || found.imageUrl || ''
            });
          }
        })
        .catch((err) => console.error('Erro ao buscar produto do banco:', err));
    }
  }, [productIdFromUrl]);

  // 2. CRO: Busca de Endereço Automática via CEP (ViaCEP)
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setCep(value);

    if (value.length === 8) {
      try {
        setCepLoading(true);
        const res = await fetch(`https://viacep.com.br/ws/${value}/json/`);
        const data = await res.json();
        
        if (!data.erro) {
          // Preenche automaticamente: "Rua, Bairro, Cidade - UF"
          setAddress(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
        } else {
          alert('CEP não localizado.');
        }
      } catch (err) {
        console.error('Falha ao localizar CEP:', err);
      } finally {
        setCepLoading(false);
      }
    }
  };

  // 3. Processamento Final de Pagamento
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          cep,
          address,
          cpf,
          paymentMethod,
          productId: product.id,
          totalAmount: product.price,
          // Para Cartão de Crédito real de produção, envie o "cardToken" gerado
          // pela biblioteca do MercadoPago.js montada na sua DOM.
          cardToken: paymentMethod === 'credit_card' ? 'mock-token-teste-antifraude' : null,
          installments: 1,
          paymentMethodId: 'visa'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao processar o seu pagamento.');
      }

      if (paymentMethod === 'pix' && data.pix) {
        // Exibe o modal com o QR Code dinâmico do Mercado Pago
        setPixData(data.pix);
      } else if (paymentMethod === 'credit_card') {
        setCardSuccess(data.status === 'approved' ? 'Aprovado!' : 'Em análise ou Recusado.');
        alert(`Pedido finalizado! Status do Cartão: ${data.status}`);
      }

    } catch (err: any) {
      alert(err.message || 'Falha na conexão com o gateway de pagamentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyClipboard = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-4 md:p-8 pt-20 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO DE CHECKOUT TRANSPARENTE */}
        <div className="lg:col-span-7 bg-[#0b0b0e]/80 border border-neutral-900 rounded-2xl p-6 md:p-8 backdrop-blur-md">
          <h2 className="text-2xl font-black mb-1 bg-gradient-to-r from-white to-[#00F2EA] bg-clip-text text-transparent">
            Seu Pedido Chega Rápido
          </h2>
          <p className="text-xs text-neutral-500 mb-6">Preencha as informações de envio e finalize.</p>

          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">
                Nome Completo
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João Silva Santos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 text-sm text-white outline-none focus:border-[#00F2EA] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 text-sm text-white outline-none focus:border-[#00F2EA] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">
                  Celular / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 text-sm text-white outline-none focus:border-[#00F2EA] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">
                  CEP {cepLoading && <span className="text-[#00F2EA] animate-pulse">(Buscando...)</span>}
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="00000000"
                  value={cep}
                  onChange={handleCepChange}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 text-sm text-white outline-none focus:border-[#00F2EA] transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">
                  Endereço Completo (Rua, Número, Bairro)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rua das Palmeiras, 123, Bloco B"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 text-sm text-white outline-none focus:border-[#00F2EA] transition-colors"
                />
              </div>
            </div>

            {/* Input adicional de CPF para o checkout transparente e gateway do Mercado Pago */}
            <div>
              <label className="text-[10px] text-neutral-400 font-bold block mb-1 uppercase tracking-wider">
                CPF (Obrigatório para emissão de PIX e faturamento)
              </label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 text-sm text-white outline-none focus:border-[#00F2EA] transition-colors"
              />
            </div>

            {/* SELETOR DE MÉTODOS DE PAGAMENTO */}
            <div className="pt-4 border-t border-neutral-900">
              <label className="text-[10px] text-neutral-400 font-bold block mb-3 uppercase tracking-wider">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                    paymentMethod === 'pix'
                      ? 'border-[#00F2EA] bg-[#00F2EA]/5 text-white'
                      : 'border-neutral-850 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl mb-1">⚡ PIX</span>
                  <span className="text-[10px] text-neutral-500">Liberação Instantânea</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                    paymentMethod === 'credit_card'
                      ? 'border-[#FF0050] bg-[#FF0050]/5 text-white'
                      : 'border-neutral-850 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl mb-1">💳 Cartão</span>
                  <span className="text-[10px] text-neutral-500">Até 12x Sem Juros</span>
                </button>
              </div>
            </div>

            {/* BOTÃO FINALIZADOR */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-xl font-bold bg-gradient-to-r from-[#00F2EA] to-[#FF0050] text-black hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200 disabled:opacity-50 text-sm tracking-wider uppercase"
            >
              {loading ? 'PROCESSANDO TRANSAÇÃO...' : 'FINALIZAR PAGAMENTO COM SEGURANÇA'}
            </button>
          </form>
        </div>

        {/* COLUNA DIREITA: PRODUTOS SELECIONADOS */}
        <div className="lg:col-span-5 bg-[#0b0b0e]/50 border border-neutral-900 rounded-2xl p-6 md:p-8 backdrop-blur-md">
          <h2 className="text-lg font-black mb-4">Produtos Selecionados</h2>
          
          <div className="flex items-center gap-4 border-b border-neutral-900 pb-5 mb-5">
            <div className="w-16 h-16 bg-black border border-neutral-850 rounded-lg overflow-hidden flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.title} className="object-cover w-full h-full" />
              ) : (
                <span className="text-[10px] text-neutral-600">Sem imagem</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-200 line-clamp-1">{product.title}</h3>
              <p className="text-xs text-[#00F2EA] mt-1">1x R$ {product.price.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-semibold text-neutral-400">Total a pagar:</span>
            <span className="text-2xl font-black text-[#00F2EA]">R$ {product.price.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* MODAL PIX DO MERCADO PAGO */}
      {pixData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b0b0e] border border-neutral-850 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl shadow-cyan-950/20">
            <h3 className="text-lg font-black text-white mb-2">⚡ Pague com Pix</h3>
            <p className="text-xs text-neutral-400 mb-6">Escaneie o QR Code ou use o Copia e Cola abaixo.</p>

            {/* Imagem do QR Code Gerado Dinamicamente pelo Mercado Pago */}
            <div className="mx-auto w-48 h-48 bg-white p-2 rounded-xl border border-neutral-800 mb-6 flex items-center justify-center">
              <img 
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="QR Code Pix" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Copia e Cola Input */}
            <div className="relative mb-6">
              <input
                type="text"
                readOnly
                value={pixData.qr_code}
                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg py-2.5 pl-3 pr-20 text-xs text-neutral-300 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="absolute right-1 top-1 bottom-1 px-3 rounded bg-[#00F2EA] text-black text-[10px] font-bold hover:opacity-90 transition-opacity"
              >
                {copied ? 'COPIADO!' : 'COPIAR'}
              </button>
            </div>

            <div className="space-y-2">
              <a
                href={pixData.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 rounded-lg border border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Pagar via Link Externo
              </a>
              <button
                type="button"
                onClick={() => setPixData(null)}
                className="block w-full py-3 rounded-lg bg-neutral-900 text-xs font-semibold text-neutral-400 hover:bg-neutral-850 transition-colors"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}