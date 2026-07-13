import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });
    }

    // AQUI VOCÊ É PROFISSIONAL: 
    // Procura se o cliente já existe no banco. Se não existir, cria a conta dele silenciosamente!
    // Você precisa ter um model "Customer" no seu schema.prisma com campo "email"
    /*
    let user = await prisma.customer.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.customer.create({ data: { email } });
    }
    */

    // Gera o cookie seguro de cliente no navegador
    cookies().set('trendrush_customer_session', email, {
      httpOnly: true, // Proteção contra roubo de sessão
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 dias logado
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}