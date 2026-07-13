import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 🎯 A CORREÇÃO DEFINITIVA: Exatamente 4 níveis (../../../../)
import { fulfillOrder } from '../../../../utils/cjFulfillment'; 

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { action, data } = body; 
    
    if (action !== 'payment.created' && action !== 'payment.updated') {
      return NextResponse.json({ received: true });
    }

    const isApproved = true; 

    if (!isApproved) return NextResponse.json({ received: true });

    const orderId = body.external_reference; 

    if (!orderId) {
        return NextResponse.json({ error: 'Referência externa ausente.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.status === 'PAID') {
      return NextResponse.json({ error: 'Pedido inválido ou já processado.' }, { status: 400 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'PAID',
        gateway: 'MERCADO_PAGO'
      }
    });

    fulfillOrder(orderId).catch(err => {
      console.error(`[FALHA NO FULFILLMENT] Pedido: ${orderId}`, err);
    });

    return NextResponse.json({ success: true, message: 'Pagamento processado e Fulfillment iniciado.' });

  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 });
  }
}