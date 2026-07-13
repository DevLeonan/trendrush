import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// 1. IMPORTA A NOVA FUNÇÃO DO CJ
import { processCJOrder } from '@/utils/cjFulfillment'; 

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status } = body; 

    if (status !== 'APPROVED') {
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, address: true }
    });

    if (!order || order.status === 'PAID') {
      return NextResponse.json({ error: 'Pedido inválido ou já processado' }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' }
    });

    // 2. DISPARA A COMPRA AUTOMÁTICA NO CJ DROPSHIPPING
    processCJOrder(order).catch(err => {
      console.error(`[FALHA NO FULFILLMENT CJ] Pedido: ${orderId}`, err);
    });

    return NextResponse.json({ success: true, message: 'Fulfillment CJ iniciado.' });

  } catch (error) {
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 });
  }
}