import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// ⚠️ SOLUÇÃO RAILWAY: Caminho relativo estrito.
// Voltando 5 níveis a partir de /src/app/api/webhooks/payment/route.ts
// Certifique-se de importar a função com o nome exato exportado no utilitário: fulfillOrder
import { fulfillOrder } from '../../../../../utils/cjFulfillment'; 

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { action, data } = body; 
    
    if (action !== 'payment.created' && action !== 'payment.updated') {
      return NextResponse.json({ received: true });
    }

    const isApproved = true; // Substituir pela lógica real do MP

    if (!isApproved) return NextResponse.json({ received: true });

    // ID do pedido salvo no external_reference do MP
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

    // 1. Atualiza pedido respeitando restrições do Schema
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'PAID',
        gateway: 'MERCADO_PAGO'
      }
    });

    // 2. DISPARA O FULFILLMENT
    // Como a sua função do utils se chama 'fulfillOrder' e aceita o orderId (string):
    fulfillOrder(orderId).catch(err => {
      console.error(`[FALHA NO FULFILLMENT] Pedido: ${orderId}`, err);
    });

    return NextResponse.json({ success: true, message: 'Pagamento processado e Fulfillment iniciado.' });

  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 });
  }
}