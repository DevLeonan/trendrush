import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cache em memória para evitar chamadas excessivas de autenticação no ciclo serverless (warm start)
let cachedToken: string | null = null;
let cachedTokenExpiry: number | null = null;

/**
 * Obtém o token de acesso da CJ Dropshipping com tratamento de cache.
 */
async function getCJAccessToken(): Promise<string> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error('A variável de ambiente CJ_API_KEY não foi configurada.');
  }

  if (cachedToken && cachedTokenExpiry && Date.now() < cachedTokenExpiry) {
    return cachedToken;
  }

  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });

  const resData = await response.json();
  if (resData.result && resData.data?.accessToken) {
    cachedToken = resData.data.accessToken;
    // O token expira em 180 dias, mas renovamos a cada 23 horas para manter a integridade
    cachedTokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
    return cachedToken;
  }

  throw new Error(resData.message || 'Falha ao autenticar na API da CJ Dropshipping.');
}

/**
 * Analisador resiliente de endereços brasileiros.
 * Como o banco SQLite armazena apenas "shippingAddress" (string completa), 
 * este parser extrai os campos estruturados exigidos pela API de logística da CJ.
 */
export function parseBrazilianAddress(addressString: string) {
  // Verificação de segurança caso o endereço venha nulo/undefined
  if (!addressString) return { street: 'Endereço não fornecido', number: 'S/N', city: 'São Paulo', state: 'SP', zip: '01001-000' };

  const cleanAddress = addressString.replace(/\s+/g, ' ').trim();

  // Busca de CEP (formato XXXXX-XXX ou XXXXXXXX)
  const cepMatch = cleanAddress.match(/(\d{5}-\d{3})|(\d{8})/);
  const zip = cepMatch ? cepMatch[0] : '01001-000'; // Fallback padrão Sé/SP se ausente

  // Busca do Estado (UF): Busca duas letras maiúsculas isoladas ou precedidas de hífen/barra
  const stateMatch = cleanAddress.match(/(?:-\s*|\/\s*|\s+)([A-Z]{2})(?:\s+|$)/i);
  const state = stateMatch ? stateMatch[1].toUpperCase() : 'SP';

  // Tentativa de isolar a Cidade com base em separadores comuns
  let city = 'São Paulo';
  const parts = cleanAddress.split(/[\-\/]/).map(p => p.trim());
  if (parts.length >= 2) {
    const possibleCity = parts[parts.length - 2];
    if (possibleCity && !possibleCity.match(/^\d/)) {
      city = possibleCity;
    }
  }

  // Divisão entre Rua e Número (procurando padrão ", [número]")
  let street = cleanAddress;
  let number = 'S/N';
  const streetNumberMatch = cleanAddress.match(/([^,]+),\s*(\d+|S\/N|s\/n)/i);
  if (streetNumberMatch) {
    street = streetNumberMatch[1].trim();
    number = streetNumberMatch[2].trim();
  }

  return { street, number, city, state, zip };
}

/**
 * Processa o fulfillment automático de um pedido pago no TrendRush enviando para a CJ Dropshipping.
 */
export async function fulfillOrder(orderId: string) {
  try {
    // Busca o pedido respeitando as propriedades permitidas do SQLite
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Pedido ${orderId} não localizado no banco.`);
    }

    if (order.status !== 'PAID') {
      console.warn(`[CJ Fulfillment] Abortado: O pedido ${orderId} está com status: ${order.status}`);
      return { success: false, reason: 'Pedido não está elegível para envio (não pago).' };
    }

    const token = await getCJAccessToken();
    const parsedAddress = parseBrazilianAddress(order.shippingAddress || '');

    // Mapeamento dinâmico dos itens respeitando a ausência do campo SKU no modelo Product do SQLite
    const productsToFulfill = order.items.map((item: any) => {
      // REGRA DE OURO: O banco usa 'supplierUrl' para o ID do fornecedor, não 'cjProductId'
      const cjVid = item.product.supplierUrl || item.product.id;
      return {
        vid: cjVid,
        quantity: item.quantity || 1,
        storeLineItemId: item.id,
      };
    });

    if (productsToFulfill.length === 0) {
      throw new Error('Nenhum item válido encontrado para processamento.');
    }

    // Tratamento seguro para campos de cliente que podem estar ausentes no banco
    const customerName = (order as any).customerName || 'Cliente TrendRush';
    const customerPhone = (order as any).customerPhone || '5511999999999';

    const payload = {
      orderNumber: `TrendRush-${order.id}`,
      shippingZip: parsedAddress.zip,
      shippingCountry: 'Brazil',
      shippingCountryCode: 'BR',
      shippingProvince: parsedAddress.state,
      shippingCity: parsedAddress.city,
      shippingCustomerName: customerName,
      shippingPhone: customerPhone,
      shippingAddress: `${parsedAddress.street}, ${parsedAddress.number}`,
      products: productsToFulfill,
      platform: 'trendrush',
      orderFlow: 1, // Fluxo manual baseado em IDs da CJ
    };

    console.log(`[CJ Fulfillment] Iniciando sincronização do pedido ${orderId}...`);

    const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok || !resData.result) {
      console.error('[CJ Fulfillment] Retorno de erro da CJ:', resData);
      throw new Error(resData.message || 'Falha na resposta da plataforma parceira.');
    }

    const cjOrderId = resData.data?.orderId || resData.data?.cjOrderId || null;

    // Atualiza o status do pedido de forma limpa
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'FULFILLED',
      },
    });

    console.log(`[CJ Fulfillment] Sincronização concluída. ID CJ: ${cjOrderId}`);
    return { success: true, cjOrderId };

  } catch (error: any) {
    console.error(`[CJ Fulfillment Error] Pedido ${orderId}:`, error.message);
    return { success: false, error: error.message };
  }
}