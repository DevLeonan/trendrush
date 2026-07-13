'use client';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';

interface ProductProps {
  id: string;
  title: string;
  price: number;
  comparePrice?: number;
  image: string;
  slug: string;
  viralScore: number;
}

export default function ProductCard({ id, title, price, comparePrice, image, slug, viralScore }: ProductProps) {
  const { addToCart } = useCart();

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="glass-morphism rounded-3xl overflow-hidden group border border-zinc-800 hover:border-brand-cyan/50 transition-all duration-300 flex flex-col justify-between animate-glow"
    >
      <div className="relative aspect-square w-full bg-zinc-950 overflow-hidden">
        <span className="absolute top-4 left-4 z-10 bg-brand-pink text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full animate-bounce">
          🔥 TREND {viralScore}%
        </span>
        <img 
          src={image} 
          alt={title} 
          className="object-cover w-full h-full transform group-hover:scale-110 transition duration-500 ease-out" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
      </div>

      <div className="p-6">
        <h3 className="text-lg font-bold truncate group-hover:text-brand-cyan duration-300">
          {title}
        </h3>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-2xl font-black text-white">R$ {price.toFixed(2)}</span>
          {comparePrice && (
            <span className="text-sm line-through text-zinc-500">R$ {comparePrice.toFixed(2)}</span>
          )}
        </div>

        <button 
          onClick={() => addToCart({ id, title, price, quantity: 1, image })}
          className="w-full mt-6 py-3 rounded-full bg-gradient-to-r from-brand-cyan to-brand-pink text-black font-extrabold text-sm tracking-wide hover:brightness-110 active:scale-95 transition-all"
        >
          COMPRAR COM DESCONTO
        </button>
      </div>
    </motion.div>
  );
}