// app/api/products/import-cj/route.ts
import { NextResponse } from 'next/server';

/**
 * Extrai o ID único do CJ (UUIDv4 ou numérico) de forma resiliente a partir de links estruturados de SEO.
 */
function extractCJProductId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  const uuidRegex = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;
  const numericIdRegex = /^\d{10,25}$/;

  // 1. Entrada direta
  if (uuidRegex.test(trimmed) || numericIdRegex.test(trimmed)) {
    return trimmed;
  }

  // 2. Análise por API de URL
  try {
    const url = new URL(trimmed);
    const idParam = url.searchParams.get('id') || url.searchParams.get('pid');
    if (idParam) {
      const cleanedId = idParam.trim();
      if (uuidRegex.test(cleanedId) || numericIdRegex.test(cleanedId) || /^[a-zA-Z0-9-]+$/.test(cleanedId)) {
        return cleanedId;
      }
    }

    const pathname = url.pathname;
    const pathMatch = pathname.match(/-p-([a-zA-Z0-9-]+)\.html/i);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1].trim();
    }
  } catch (error) {}

  // 3. Fallbacks de Regex
  const uuidMatch = trimmed.match(/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/i);
  if (uuidMatch) return uuidMatch[0];

  const pHtmlMatch = trimmed.match(/-p-([a-zA-Z0-9-]+)\.html/i);
  if (pHtmlMatch && pHtmlMatch[1]) return pHtmlMatch[1];

  const idQueryMatch = trimmed.match(/[?&](?:id|pid)=([a-zA-Z0-9-]+)/i);
  if (idQueryMatch && idQueryMatch[1]) return idQueryMatch[1];

  const numericMatch = trimmed.match(/\b\d{15,25}\b/);
  if (numericMatch) return numericMatch[0];

  return null;
}

export async function POST(req: Request) {
  try {
    const { cjProductId } = await req.json();

    if (!cjProductId) {
      return NextResponse.json({ error: 'Nenhum link fornecido.' }, { status: 400 });
    }

    const apiKey = process.env.CJ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'CJ_API_KEY não configurada no ambiente.' }, { status: 500 });
    }

    // 1. Extração robusta do identificador único (UUID ou numérico)
    const exactIdentifier = extractCJProductId(cjProductId);
    if (!exactIdentifier) {
      return NextResponse.json({ error: 'Não foi possível extrair o ID do link fornecido.' }, { status: 400 });
    }

    // 2. Autenticação na API do CJ
    const authRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey })
    });

    const authData = await authRes.json();
    if (authData.code !== 200 || !authData.data) {
      return NextResponse.json({ error: 'Falha na Autenticação CJ.' }, { status: 401 });
    }

    const accessToken = authData.data.accessToken || authData.data;

    // 3. Consulta de detalhes do produto
    const detailsUrl = `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${exactIdentifier}`;
    const detailsRes = await fetch(detailsUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'CJ-Access-Token': accessToken 
      }
    });

    const cjData = await detailsRes.json();
    if (cjData.code !== 200 || !cjData.data) {
      return NextResponse.json({ 
        error: `O CJ recusou a requisição: ${cjData.message || 'ID não localizado'}` 
      }, { status: 404 });
    }

    const productInfo = cjData.data;

    // 4. Tratamento dos dados para auto-fill (Dólar -> Real com margem)
    const rawCost = parseFloat(productInfo.productPrice) || parseFloat(productInfo.sellPrice) || 0;
    const costInBRL = rawCost * 5.5; 
    const suggestedPrice = costInBRL * 2.5; 

    return NextResponse.json({ 
      success: true, 
      product: {
        title: productInfo.productNameEn || '',
        description: productInfo.description || '',
        costPrice: costInBRL,
        price: suggestedPrice,
        category: productInfo.categoryName || 'Geral',
        stock: parseInt(productInfo.sellInventory) || 100,
        imageUrl: productInfo.productImageSet?.[0] || '', 
        supplierUrl: exactIdentifier // ID usado no webhook/fulfillment subsequente
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('[CJ_IMPORT_ERROR]', error);
    return NextResponse.json({ error: 'Falha interna ao processar a importação.' }, { status: 500 });
  }
}