// src/app/api/products/import-cj/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Cache em memória local do Token de Importação
let importToken: string | null = null;
let importTokenExpiry: number | null = null;

async function getCJImportToken(): Promise<string> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    throw new Error('A variável de ambiente CJ_API_KEY não foi configurada.');
  }

  if (importToken && importTokenExpiry && Date.now() < importTokenExpiry) {
    return importToken;
  }

  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });

  const resData = await response.json();
  if (resData.result && resData.data?.accessToken) {
    importToken = resData.data.accessToken;
    importTokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
    return importToken;
  }

  throw new Error(resData.message || 'Autenticação rejeitada pela CJ Dropshipping.');
}

/**
 * Extração resiliente de IDs numéricos clássicos ou UUIDv4 das URLs da CJ Dropshipping.
 */
function extractProductId(url: string): string | null {
  // Padrão amigável de SEO: "...-p-[ID].html"
  const seoMatch = url.match(/-p-([a-zA-Z0-9-]+)(?:\.html)?/);
  if (seoMatch) return seoMatch[1];

  // Caso seja inserido apenas o UUID diretamente
  const uuidMatch = url.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (uuidMatch) return uuidMatch[0];

  // Fallback para IDs numéricos sequenciais puros
  const idMatch = url.match(/^[a-zA-Z0-9-]+$/);
  if (idMatch) return url;

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'A URL do produto é obrigatória.' }, { status: 400 });
    }

    const productId = extractProductId(url);
    if (!productId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Não foi possível detectar um ID válido na URL fornecida. Verifique o link e tente novamente.' 
      }, { status: 400 });
    }

    const token = await getCJImportToken();

    // Chamada à API de detalhes da CJ
    const queryUrl = `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${productId}`;
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
    });

    if (!response.ok) {
      throw new Error(`Falha na resposta do servidor externo (Status: ${response.status})`);
    }

    const resData = await response.json();
    if (!resData.result || !resData.data) {
      return NextResponse.json({ 
        success: false, 
        error: resData.message || 'Produto não encontrado ou indisponível na CJ Dropshipping.' 
      }, { status: 404 });
    }

    const productData = resData.data;

    // Resiliência no mapeamento de imagens
    let imageUrls: string[] = [];
    if (Array.isArray(productData.productImages)) {
      imageUrls = productData.productImages;
    } else if (typeof productData.productImage === 'string') {
      imageUrls = productData.productImage.split(',').map((img: string) => img.trim());
    }
    imageUrls = imageUrls.filter(Boolean);

    // Precificação com Inteligência de Margem e CRO (Foco em conversão psicológica)
    const rawCostPrice = parseFloat(productData.sellPrice || '0');
    const rawSuggestPrice = parseFloat(productData.suggestSellPrice || '0');

    const costPrice = rawCostPrice > 0 ? rawCostPrice : 15.0; // Fallback se zerado
    
    // Algoritmo de Markup: Garante margem operacional mínima de 2.5x se a recomendada for baixa
    let suggestedPrice = rawSuggestPrice > costPrice ? rawSuggestPrice : costPrice * 2.5;

    // Arredondamento estratégico de alta conversão para o mercado premium (terminados em .90 ou .97)
    suggestedPrice = Math.ceil(suggestedPrice) - 0.10; // Ex: R$ 89,90

    // Criação do payload estruturado respeitando os campos obrigatórios e restrições do banco
    const autoFillPayload = {
      title: productData.productNameEn || productData.productName || 'Produto Importado da CJ',
      description: productData.productHtmlDescription || productData.description || 'Nenhuma descrição detalhada disponível.',
      costPrice: costPrice,
      price: suggestedPrice,
      comparePrice: suggestedPrice * 1.6, // Preço riscado com 60% de ancoragem visual
      images: imageUrls.map(urlStr => ({ url: urlStr })), // Envia apenas url de acordo com a regra de ouro
      supplierUrl: url,
      cjProductId: productData.pid || productId,
    };

    return NextResponse.json({ 
      success: true, 
      data: autoFillPayload 
    });

  } catch (error: any) {
    console.error('[CJ Import Error]:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Ocorreu um erro interno ao processar a importação deste item.' 
    }, { status: 500 });
  }
}