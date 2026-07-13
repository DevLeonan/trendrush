// app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();
const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    if (!cookieStore.has('trendrush_admin_session')) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    const id = params.id;
    const body = await req.json();
    
    // 💡 SOLUÇÃO: Removemos o 'category' da desestruturação para não dar conflito com o schema
    const { title, description, price, comparePrice, costPrice, stock, images, supplierUrl } = body;

    // 💡 SOLUÇÃO: Retiramos o 'category' da validação de campos obrigatórios
    if (!title || !description || price === undefined || costPrice === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const slug = generateSlug(title) + '-' + Date.now().toString().slice(-4);

    // Limpa referências antigas para manter integridade no SQLite
    await prisma.productImage.deleteMany({ where: { productId: id } });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        price,
        costPrice,
        comparePrice: comparePrice || null,
        // 💡 SOLUÇÃO: A linha 'category,' foi removida daqui!
        stock,
        supplierUrl: supplierUrl || null,
        images: {
          create: images && images.length > 0 ? images.map((url: string) => ({ url })) : []
        }
      },
      include: { images: true }
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    console.error('[UPDATE_PRODUCT_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao salvar alterações no banco.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    if (!cookieStore.has('trendrush_admin_session')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const id = params.id;

    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Produto removido com sucesso.' }, { status: 200 });
  } catch (error: any) {
    console.error('[DELETE_PRODUCT_ERROR]', error);
    return NextResponse.json({ error: 'Erro ao excluir o registro.' }, { status: 500 });
  }
}