'use client';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-dark pt-16">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-cyan/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse-fast" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-brand-pink/10 rounded-full filter blur-[120px] pointer-events-none animate-pulse-fast" />

      <div className="container mx-auto px-4 text-center z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-morphism text-xs font-semibold tracking-wide uppercase mb-6"
        >
          <span className="w-2.5 h-2.5 bg-brand-pink rounded-full animate-ping" />
          <span className="text-brand-cyan">OS PRODUTOS MAIS VIRALIZADOS DO BRASIL</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-brand-cyan to-brand-pink"
        >
          TRENDRUSH
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-2xl font-light max-w-2xl mx-auto text-zinc-400 mb-10"
        >
          Os produtos que viralizam chegam primeiro aqui. Tenha acesso a gadgets e tecnologias mundiais com frete grátis garantido.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a 
            href="#produtos" 
            className="px-8 py-4 bg-white text-black font-extrabold rounded-full hover:bg-brand-cyan hover:scale-105 duration-300 shadow-lg shadow-white/10"
          >
            Explorar Tendências
          </a>
          <a 
            href="#ofertas" 
            className="px-8 py-4 glass-morphism hover:bg-white/5 rounded-full font-bold hover:border-brand-pink duration-300"
          >
            Ofertas Relâmpago
          </a>
        </motion.div>
      </div>
    </div>
  );
}