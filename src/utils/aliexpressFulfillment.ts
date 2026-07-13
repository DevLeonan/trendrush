import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processCJOrder(order: any) {
  console.log(`[FULFILLMENT] Iniciando compra automática no CJ Dropshipping - Pedido: ${order.id}`);

  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error('CJ_API_KEY não configurada no .env.local');
  }

  for (const item of order.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });

    if (!product || !product.supplierUrl) {
      console.warn(`[AVISO] Produto ${item.productId} sem mapeamento de fornecedor.`);
      continue;
    }

    // Estrutura de Payload padrão exigida pela API do CJ Dropshipping
    const cjPayload = {
      orderNumber: order.id,
      shippingZip: order.address.zipCode,
      shippingCountry: "BR",
      shippingProvince: "RS", // Em produção, extraia do order.address
      shippingCity: "Cidade do Cliente", // Em produção, extraia do order.address
      shippingAddress: `${order.address.street}, ${order.address.number}`,
      shippingCustomerName: order.customerName,
      shippingPhone: order.customerCpf, // Ou telefone real do cliente
      products: [
        {
          vid: product.supplierUrl, // O ID do produto/variante no CJ
          quantity: item.quantity
        }
      ]
    };

    try {
      // Disparo da requisição para a API oficial do CJDropshipping
      const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': apiKey
        },
        body: JSON.stringify(cjPayload)
      });

      const data = await response.json();

      if (data.code === 200) {
        console.log(`✅ [SUCESSO] Pedido do produto ${product.title} enviado ao CJ! ID CJ: ${data.data}`);
        
        // Opcional: Salvar o ID do pedido do CJ no seu banco para rastreio
      } else {
        console.error(`❌ [ERRO API CJ] Falha ao processar pedido ${order.id}:`, data.message);
      }

    } catch (error) {
      console.error(`❌ [ERRO DE REDE] Falha de comunicação com CJ para o produto ${product.title}`, error);
    }
  }
}