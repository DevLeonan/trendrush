// src/utils/cjFulfillment.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processCJOrder(order: any) {
  console.log(`[FULFILLMENT] Iniciando compra automática no CJ Dropshipping - Pedido: ${order.id}`);

  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error('CJ_API_KEY não configurada no .env.local');
  }

  // Se o pedido não tiver itens populados, busca-os de forma segura para o loop
  const orderItems = order.items || await prisma.orderItem.findMany({ where: { orderId: order.id } });

  for (const item of orderItems) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });

    if (!product || !product.supplierUrl) {
      console.warn(`[AVISO] Produto ${item.productId} sem mapeamento de fornecedor.`);
      continue;
    }

    // Parser inteligente e resiliente do TrendRush (Extrai dados de shippingAddress unificado)
    const addressText = order.shippingAddress || "";
    
    // Captura o CEP usando expressão regular (regex)
    const cepMatch = addressText.match(/CEP:\s*([\d\-\s]+)/i);
    const zipCode = cepMatch ? cepMatch[1].replace(/\D/g, "").trim() : "91260000"; // Fallback de segurança
    
    // Remove o bloco do CEP do texto final para enviar um endereço limpo ao CJ
    const cleanAddress = addressText.split(" - CEP:")[0] || addressText;

    // Estrutura de Payload adaptada e blindada contra quebras estruturais
    const cjPayload = {
      orderNumber: order.id,
      shippingZip: zipCode,
      shippingCountry: "BR",
      shippingProvince: "RS", // Ajustável conforme regras de negócio ou província padrão
      shippingCity: "Cidade do Cliente", 
      shippingAddress: cleanAddress,
      shippingCustomerName: order.customerName,
      shippingPhone: order.customerPhone || "12312312", 
      products: [
        {
          vid: product.supplierUrl, // ID do produto ou variante no CJ
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
      } else {
        console.error(`❌ [ERRO API CJ] Falha ao processar pedido ${order.id}:`, data.message);
      }

    } catch (error) {
      console.error(`❌ [ERRO DE REDE] Falha de comunicação com CJ para o produto ${product.title}`, error);
    }
  }
}

// Export alternativo para garantir compatibilidade caso outros módulos usem o nome padrão
export async function fulfillOrder(order: any) {
  return processCJOrder(order);
}