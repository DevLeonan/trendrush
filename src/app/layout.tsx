'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider, useCart } from "./context/CartContext";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

function Header() {
  const { cart } = useCart();
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-zinc-800/80">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-brand-cyan to-brand-pink bg-clip-text text-transparent">
            TrendRush
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
          <Link href="/" className="hover:text-white transition">Início</Link>
          <a href="#produtos" className="hover:text-white transition">Tendências</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="/checkout" 
            className="relative p-2.5 bg-zinc-900 border border-zinc-800 rounded-full hover:border-brand-cyan transition"
          >
            <span className="text-lg">🛒</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {totalItems}
              </span>
            )}
          </Link>
          <Link 
            href="/checkout" 
            className="hidden sm:inline-block px-5 py-2.5 bg-gradient-to-r from-brand-cyan to-brand-pink text-black text-xs font-black rounded-full hover:brightness-110 transition"
          >
            Checkout Rápido
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.className} bg-brand-dark text-white antialiased`}>
        <CartProvider>
          <Header />
          <main className="pt-16">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}