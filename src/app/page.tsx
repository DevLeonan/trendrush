// src/app/page.tsx
import { PrismaClient } from '@prisma/client';
import Hero from '@/components/storefront/Hero';
import ProductCard from '@/components/storefront/ProductCard';

// Singleton do Prisma para prevenir esgotamento de conexões no SQLite em desenvolvimento
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Desativa o cache da página (Server-Side Rendering dinâmico) para atualizar novos produtos do CJ na hora
export const revalidate = 0; 

async function getProducts() {
  try {
    const dbProducts = await prisma.product.findMany({
      include: {
        images: true
      },
      orderBy: {
        id: 'desc' // Fallback seguro caso o 'createdAt' varie de estrutura no SQLite
      }
    });

    // Traduz os dados do banco para o formato esperado pelo componente <ProductCard />
    return dbProducts.map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      // Fallback de imagem abstrata premium em alta qualidade se o produto não tiver imagem cadastrada
      image: product.images[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      viralScore: product.viralScore || 85
    }));
  } catch (error) {
    console.error("Erro sênior ao carregar produtos do banco de dados:", error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-[#050507] pb-32 text-white selection:bg-[#00F2EA]/30">
      
      {/* Seção Principal (Hero) */}
      <Hero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16" id="produtos">
        
        {/* Cabeçalho da Vitrine Otimizado para Conversão (CRO) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-[#00F2EA] bg-clip-text text-transparent">
              Tendências Explosivas 🔥
            </h2>
            <p className="text-sm text-neutral-400 mt-2 font-medium max-w-xl">
              Dispositivos inteligentes e gadgets virais selecionados por inteligência de tráfego, prontos para despacho expresso.
            </p>
          </div>
          
          {/* Badge de status da Vitrine (Passa autoridade de estoque e sincronização) */}
          <div className="flex items-center gap-2 self-start md:self-end bg-neutral-900/40 border border-neutral-800/80 rounded-full px-3.5 py-1.5 text-[11px] text-[#00F2EA] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00F2EA] animate-pulse" />
            Sincronizado com Centro de Distribuição
          </div>
        </div>
        
        {/* Renderização Condicional da Vitrine */}
        {products.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-neutral-800 rounded-3xl bg-neutral-950/20 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-neutral-900/60 flex items-center justify-center border border-neutral-800 text-2xl mb-4 text-neutral-400">
              📦
            </div>
            <h3 className="text-md font-bold text-neutral-300">Nenhum produto cadastrado</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              Estamos abastecendo nossos galpões de dropshipping premium. Volte em alguns minutos!
            </p>
          </div>
        ) : (
          /* Grid Responsivo de Cartões de Produtos */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}