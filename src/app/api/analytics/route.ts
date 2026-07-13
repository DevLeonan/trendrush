import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, productId, device, source, region } = body;

    // 💡 SOLUÇÃO SÊNIOR: Como a tabela 'AnalyticsEvent' não existe no schema.prisma ainda,
    // nós vamos apenas registrar no painel da Railway (console) para não quebrar o build.
    // Futuramente, quando criarmos a tabela, voltamos o prisma.create aqui.
    console.log(`[ANALYTICS] Evento: ${eventType} | Produto: ${productId} | Origem: ${source}`);

    return NextResponse.json({ 
      success: true, 
      message: "Evento recebido e logado com sucesso (Modo Mock)" 
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}