// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// =========================================================================
// GET - Listar produtos no dashboard
// =========================================================================
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    if (!cookieStore.has('trendrush_admin_session')) {
      return NextResponse.json({ error: 'Sessão administrativa ausente.' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: { images: true },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error('[GET_PRODUCTS_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao carregar a lista de produtos.' }, { status: 500 });
  }
}

// =========================================================================
// POST - Salvar produto (Mantendo sua estrutura original intacta)
// =========================================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, price, comparePrice, costPrice, category, stock, images, supplierUrl } = body;

    if (!title || !description || price === undefined || costPrice === undefined || !category || stock === undefined) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios ausentes. Verifique: Título, Descrição, Preços, Categoria ou Estoque.' 
      }, { status: 400 });
    }

    const slug = generateSlug(title) + '-' + Date.now().toString().slice(-4);

    const newProduct = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        price,
        costPrice,
        comparePrice: comparePrice || null,
        category,
        stock,
        supplierUrl: supplierUrl || null,
        viralScore: 80,
        images: {
          create: images && images.length > 0 
            ? images.map((url: string) => ({ url })) // Sem 'isMain' conforme regras rígidas do Prisma
            : []
        }
      }
    });

    return NextResponse.json(newProduct, { status: 201 });

  } catch (error: any) {
    console.error('[CREATE_PRODUCT_ERROR]', error);
    if (error.name === 'PrismaClientValidationError') {
      return NextResponse.json({ error: 'Erro estrutural do Prisma com o SQLite.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno ao salvar no banco de dados.' }, { status: 500 });
  }
}