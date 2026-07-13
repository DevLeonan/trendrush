import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função utilitária para gerar slugs limpos
const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('aliexpress.com')) {
      return NextResponse.json({ error: 'URL do AliExpress inválida.' }, { status: 400 });
    }

    // SIMULAÇÃO DE SCRAPER: Em produção, você conectaria a uma API como ScraperAPI ou Zyte aqui.
    // Estamos garantindo que as regras (sem SKU, usando "title", "comparePrice", imagens sem "isMain") sejam cumpridas.
    const scrapedData = {
      title: "Smartwatch Ultra 9 PRO Series 2024 - Tela AMOLED",
      description: "<p>Produto viral com alta taxa de conversão.</p>",
      price: 197.90, // Preço de venda (mark-up aplicado)
      costPrice: 45.50, // Preço pago no fornecedor
      comparePrice: 299.90, // Preço riscado (gatilho de ancoragem)
      category: "Eletrônicos",
      stock: 500, // Estoque virtual importado
      supplierUrl: url,
      images: [
        { url: "https://exemplo.com/watch-1.jpg" },
        { url: "https://exemplo.com/watch-2.jpg" }
      ]
    };

    const slug = generateSlug(scrapedData.title) + '-' + Date.now().toString().slice(-4);

    // Salvando no banco respeitando as regras estritas do Prisma Schema
    const newProduct = await prisma.product.create({
      data: {
        title: scrapedData.title,
        slug: slug,
        description: scrapedData.description,
        price: scrapedData.price,
        costPrice: scrapedData.costPrice,
        comparePrice: scrapedData.comparePrice,
        category: scrapedData.category,
        stock: scrapedData.stock,
        supplierUrl: scrapedData.supplierUrl,
        viralScore: 85, // Score inicial de teste
        images: {
          create: scrapedData.images.map(img => ({
            url: img.url
            // ATENÇÃO: 'isMain' omitido conforme especificação
          }))
        }
        // ATENÇÃO: 'sku' omitido conforme especificação
      }
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });

  } catch (error: any) {
    console.error('[ALIEXPRESS_IMPORT_ERROR]', error);
    // Tratamento específico de erro de validação do Prisma
    if (error.name === 'PrismaClientValidationError') {
      return NextResponse.json({ error: 'Erro de Validação do Schema. Verifique os campos enviados.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Falha ao importar produto.' }, { status: 500 });
  }
}