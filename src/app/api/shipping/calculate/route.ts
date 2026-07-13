// src/app/api/shipping/calculate/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cep = searchParams.get('cep');

  if (!cep || cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
  }

  try {
    // 1. Descobrir a região através do CEP (usando BrasilAPI para velocidade)
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
    if (!response.ok) {
      throw new Error('Falha ao localizar CEP');
    }
    
    const addressData = await response.json();
    const state = addressData.state; // Retorna UF como "SP", "RJ", "AM", etc.

    // 2. Definir prazos médios de logística internacional estimados para cada região do Brasil
    let minDays = 7;
    let maxDays = 14;

    // Regiões Norte e Nordeste costumam ter prazos de trânsito interno ligeiramente maiores
    const longDeliveryStates = ['AM', 'PA', 'AP', 'RR', 'AC', 'RO', 'TO', 'MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'];
    if (longDeliveryStates.includes(state)) {
      minDays = 12;
      maxDays = 22;
    }

    return NextResponse.json({
      success: true,
      city: addressData.city,
      state: addressData.state,
      street: addressData.street || '',
      neighborhood: addressData.neighborhood || '',
      shippingOption: 'Envio Internacional Prioritário (Com Rastreamento)',
      price: 0.00, // Geralmente dropshipping de conversão máxima utiliza Frete Grátis
      deliveryTimeMessage: `Entrega estimada entre ${minDays} e ${maxDays} dias úteis`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao calcular frete para este CEP.' }, { status: 500 });
  }
}