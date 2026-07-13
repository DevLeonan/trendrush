import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (email === adminEmail && password === adminPass) {
      // Cria um cookie HttpOnly (inacessível para hackers via JavaScript no navegador)
      cookies().set('trendrush_admin_session', 'autenticado_com_sucesso', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // Duração: 24 horas
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Credenciais inválidas. Acesso negado.' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}