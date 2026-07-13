// src/app/product/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

// Mock local estruturado para garantir funcionamento imediato
const LOCAL_PRODUCTS_FALLBACK: Record<string, any> = {
  'aerotrack-pods-pro': {
    id: 'prod_aero_pods',
    name: 'AeroTrack Pods Pro - Edição Limitada Neon',
    price: 189.90,
    compareAtPrice: 349.90,
    description: 'Experimente a fusão perfeita entre áudio de alta fidelidade e design premium cyberpunk. Com cancelamento ativo de ruído inteligente, graves ultra-profundos ajustados por IA e um estojo translúcido com iluminação LED personalizável.',
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80'
    ],
    features: ['Até 40h de Bateria', 'Resistência à água IPX7', 'Hi-Res Audio Certificado', 'Carregamento Sem Fio']
  },
  'aura-quantum-v1': {
    id: 'prod_aura_watch',
    name: 'Smartwatch Aura Quantum V1',
    price: 297.00,
    compareAtPrice: 599.00,
    description: 'O relógio inteligente que redefine a alta performance. Tela AMOLED curva de 120Hz com efeito infinito, monitoramento biométrico militar, bateria de longa duração para até 14 dias e acabamento em titânio fosco espacial.',
    stock: 18,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800&auto=format&fit=crop&q=80'
    ],
    features: ['Tela AMOLED 120Hz', 'Sensor Biométrico Militar', 'GPS Integrado', 'Bateria de 14 dias']
  }
};

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart } = useCart();
  
  const product = LOCAL_PRODUCTS_FALLBACK[slug] || LOCAL_PRODUCTS_FALLBACK['aerotrack-pods-pro'];
  
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [selectedVariant, setSelectedVariant] = useState('Default');
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });
  const [unitsLeft, setUnitsLeft] = useState(product.stock);

  // Gatilho de Escassez (Cronômetro regressivo)
  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft.seconds > 0) {
        setTimeLeft(prev => ({ ...prev, seconds: prev.seconds - 1 }));
      } else if (timeLeft.minutes > 0) {
        setTimeLeft(prev => ({ minutes: prev.minutes - 1, seconds: 59 }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Redução simulada de estoque dinâmico
  useEffect(() => {
    const stockTimer = setInterval(() => {
      if (unitsLeft > 3) {
        setUnitsLeft(prev => prev - Math.floor(Math.random() * 2));
      }
    }, 15000);
    return () => clearInterval(stockTimer);
  }, [unitsLeft]);

  const handleBuyNow = () => {
    addToCart({
      id: product.id,
      title: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1
    });
    window.location.href = '/checkout';
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Galeria de Imagens Lateral */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 flex items-center justify-center">
            <motion.img 
              key={activeImage}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
            {/* Tag Viral */}
            <div className="absolute top-4 left-4 bg-gradient-to-r from-brand-cyan to-brand-pink text-black font-black px-3 py-1.5 rounded-full text-xs uppercase tracking-wider">
              🔥 Viral no TikTok
            </div>
          </div>
          
          <div className="flex gap-4">
            {product.images.map((img: string, idx: number) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(img)}
                className={`w-24 h-24 rounded-2xl border overflow-hidden transition-all bg-zinc-950 ${
                  activeImage === img ? 'border-brand-cyan scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Informações do Produto & Conversão */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            {product.name}
          </h1>

          {/* Social Proof de Visualização */}
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span>42 pessoas estão olhando este produto agora</span>
          </div>

          {/* Preços com desconto em destaque */}
          <div className="flex items-baseline gap-4 py-2">
            <span className="text-4xl font-black text-brand-cyan">
              R$ {product.price.toFixed(2)}
            </span>
            <span className="text-lg text-zinc-500 line-through">
              R$ {product.compareAtPrice.toFixed(2)}
            </span>
            <span className="bg-brand-pink/15 text-brand-pink text-xs font-bold px-2.5 py-1 rounded-md">
              -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
            </span>
          </div>

          <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
            {product.description}
          </p>

          {/* Benefícios Rápidos */}
          <div className="grid grid-cols-2 gap-3 py-4 border-y border-zinc-800/60">
            {product.features.map((feat: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                <span className="text-brand-cyan text-base">✦</span>
                {feat}
              </div>
            ))}
          </div>

          {/* Contador de Escassez Ativo */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
              <span className="text-brand-pink">Apenas {unitsLeft} unidades restantes!</span>
              <span>Oferta expira em: {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
            {/* Barra de Progresso */}
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-brand-pink to-brand-cyan h-full"
                animate={{ width: `${(unitsLeft / product.stock) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Botão de Compra Ultra Chamativo */}
          <button 
            onClick={handleBuyNow}
            className="w-full py-5 rounded-full bg-gradient-to-r from-brand-cyan to-brand-pink text-black font-black text-xl tracking-wider hover:scale-[1.01] active:scale-95 duration-200 shadow-lg shadow-brand-cyan/10"
          >
            COMPRAR COM DESCONTO AGORA
          </button>

          {/* Selos de Segurança e Confiança */}
          <div className="flex justify-center items-center gap-6 py-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span>🛡️</span> Compra 100% Segura
            </div>
            <div className="flex items-center gap-1.5">
              <span>🚚</span> Envio com Rastreio
            </div>
            <div className="flex items-center gap-1.5">
              <span>🔄</span> 7 dias para Devolução
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}