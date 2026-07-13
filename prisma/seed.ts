// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('Populando banco de dados com produtos virais...');

  await prisma.product.create({
    data: {
      id: 'prod_aero_pods',
      title: 'AeroTrack Pods Pro - Edição Limitada Neon',
      slug: 'aerotrack-pods-pro',
      description: 'Experimente a fusão perfeita entre áudio de alta fidelidade e design premium cyberpunk. Com cancelamento ativo de ruído inteligente, graves ultra-profundos ajustados por IA e um estojo translúcido com iluminação LED personalizável.',
      price: 189.90,
      comparePrice: 349.90,
      costPrice: 75.00,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80' },
          { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80' },
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      id: 'prod_aura_watch',
      title: 'Smartwatch Aura Quantum V1',
      slug: 'aura-quantum-v1',
      description: 'O relógio inteligente que redefine a alta performance. Tela AMOLED curva de 120Hz com efeito infinito, monitoramento biométrico militar, bateria de longa duração para até 14 dias e acabamento em titânio fosco espacial.',
      price: 297.00,
      comparePrice: 599.00,
      costPrice: 110.00,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80' },
          { url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800&auto=format&fit=crop&q=80' }
        ]
      }
    }
  });

  console.log('Seed realizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });