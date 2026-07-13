// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CartItem {
interface CartItem {
  productId?: string;
  id?: string;
  quantity?: number;
  qtd?: number;
  qty?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. MAPEAÇÃO DE DADOS CADASTRAIS (Tolerante a falhas do frontend)
    const email = body.email || body.customerEmail || body.eMail;
    const cpf = body.cpf || body.document || body.documento;
    const phone = body.phone || body.customerPhone || body.whatsapp || body.celular || body.phone_number;
    const paymentMethod = body.paymentMethod || body.payment_method || "pix";

    // Captura o nome completo enviado e separa inteligentemente em FirstName e LastName
    const rawFullName = body.name || body.fullName || body.nome || body.customerName || "";
    let firstName = body.firstName;
    let lastName = body.lastName;

    if (!firstName && rawFullName) {
      const nameParts = rawFullName.trim().split(/\s+/);
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(" ") || "Souza"; // Sobrenome padrão de fallback
    }

    // Captura do Endereço (Suporta texto único unificado ou campos estruturados)
    const cep = body.cep || body.zipCode;
    const rawCombinedAddress = body.address || body.endereco || body.shippingAddress;
    
    let shippingAddress = "";
    if (rawCombinedAddress) {
      shippingAddress = `${rawCombinedAddress}${cep ? ` - CEP: ${cep}` : ""}`;
    } else {
      shippingAddress = `${body.street || ""}, ${body.number || ""} - ${body.neighborhood || ""}, ${body.city || ""}/${body.state || ""}${cep ? ` - CEP: ${cep}` : ""}`;
    }

    // 2. CONVERSÃO DE SINGLE PRODUCT CHECKOUT PARA FORMATO DE CARRINHO
    let rawItems = body.items || body.cart || body.products || body.cartItems || body.orderItems || body.itens || body.carrinho || [];

    // Se o frontend enviou um productId avulso na raiz do JSON (padrão de checkout de 1 clique)
    if (body.productId && (!Array.isArray(rawItems) || rawItems.length === 0)) {
      rawItems = [{ productId: body.productId, quantity: 1 }];
    }

    // Se a lista de itens ainda estiver vazia, tenta achar qualquer array no JSON
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      for (const key of Object.keys(body)) {
        if (Array.isArray(body[key]) && body[key].length > 0) {
          rawItems = body[key];
          break;
        }
      }
    }

    // 3. DIAGNÓSTICO DE CAMPOS AUSENTES
    const missingFields: string[] = [];
    if (!email) missingFields.push("E-mail");
    if (!firstName) missingFields.push("Nome");
    if (!cpf) missingFields.push("CPF");
    if (!shippingAddress || shippingAddress.trim() === "" || shippingAddress.startsWith(",")) {
      missingFields.push("Endereço Completo");
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      missingFields.push("Itens do Carrinho / ID do Produto");
    }

    if (missingFields.length > 0) {
      const keysReceived = Object.keys(body).join(", ") || "Nenhum dado enviado";
      return NextResponse.json(
        { 
          error: `Por favor, preencha: ${missingFields.join(", ")}. (Campos identificados no envio: [${keysReceived}])` 
        },
        { status: 400 }
      );
    }

    // 4. PROCESSAMENTO DOS ITENS E PRECIFICAÇÃO DE SEGURANÇA
    let calculatedTotal = 0;
    let calculatedCostTotal = 0;
    const resolvedItems = [];

    for (const item of rawItems as CartItem[]) {
      const targetProductId = item.productId || item.id;

      if (!targetProductId) {
        return NextResponse.json(
          { error: "Identificador de produto não encontrado no carrinho." },
          { status: 400 }
        );
      }

      const dbProduct = await prisma.product.findUnique({
        where: { id: targetProductId },
      });

      if (!dbProduct) {
        return NextResponse.json(
          { error: `Produto com ID '${targetProductId}' não foi localizado no estoque.` },
          { status: 404 }
        );
      }

      const quantity = Number(item.quantity || item.qtd || item.qty || 1);
      calculatedTotal += dbProduct.price * quantity;
      calculatedCostTotal += dbProduct.costPrice * quantity;

      resolvedItems.push({
        productId: dbProduct.id,
        quantity,
        price: dbProduct.price,
      });
    }

    // 5. INTEGRAÇÃO COM MERCADO PAGO
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      return NextResponse.json(
        { error: "Gateway de pagamento não configurado no servidor (MP_ACCESS_TOKEN ausente)." },
        { status: 500 }
      );
    }

    const idempotencyKey = crypto.randomUUID();
    const payerName = `${firstName} ${lastName}`;

    const mpPayload: any = {
      transaction_amount: Number(calculatedTotal.toFixed(2)),
      description: "Compra TrendRush Store",
      payer: {
        email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: "CPF",
          number: cpf.replace(/\D/g, ""),
        },
      },
    };

    if (paymentMethod === "pix") {
      mpPayload.payment_method_id = "pix";
    } else if (paymentMethod === "credit_card") {
      mpPayload.token = body.cardToken;
      mpPayload.installments = Number(body.installments || 1);
      mpPayload.payment_method_id = body.paymentMethodId;
      mpPayload.issuer_id = body.issuerId ? String(body.issuerId) : undefined;
    } else {
      return NextResponse.json({ error: "Método de pagamento inválido." }, { status: 400 });
    }

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(mpPayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      return NextResponse.json(
        { error: mpData.message || "Erro no processamento com o Mercado Pago." },
        { status: mpResponse.status }
      );
    }

    // 6. GRAVAÇÃO DA ORDEM E ITENS NO BANCO DE DADOS (Compatibilidade Estrita Prisma/SQLite)
    // O uso de 'productId' direto na tabela filha 'OrderItem' substitui o 'connect' aninhado,
    // evitando conflitos no motor de compilação do Prisma.
    const order = await prisma.order.create({
      data: {
        customerEmail: email,
        customerName: payerName,
        customerPhone: phone || "",
        shippingAddress: shippingAddress,
        total: Number(calculatedTotal.toFixed(2)),
        costTotal: Number(calculatedCostTotal.toFixed(2)),
        gateway: "MERCADO_PAGO",
        status: mpData.status === "approved" ? "PAID" : "PENDING",
        items: {
          create: resolvedItems.map((item) => ({
            quantity: item.quantity,
            price: item.price,
            productId: item.productId, // Injeção direta de chave estrangeira (Unchecked write)
          }))
        }
      },
    });

    // 7. PAYLOAD DE RETORNO OTIMIZADO PARA ALTA CONVERSÃO (CRO)
    const responsePayload: any = {
      orderId: order.id,
      status: mpData.status,
      statusDetail: mpData.status_detail,
    };

    if (paymentMethod === "pix" && mpData.point_of_interaction?.transaction_data) {
      const trxData = mpData.point_of_interaction.transaction_data;
      responsePayload.pix = {
        qrCodeBase64: trxData.qr_code_base64,
        qrCode: trxData.qr_code,
      };
    }

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error: any) {
    console.error("🚨 [Checkout Critical Error]:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao processar o checkout." },
      { status: 500 }
    );
  }
}