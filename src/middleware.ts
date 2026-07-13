import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // 1. BARREIRA DO PAINEL EXECUTIVO (ADMIN)
  if (url.startsWith('/dashboard')) {
    const adminSession = request.cookies.get('trendrush_admin_session')?.value;
    if (!adminSession) {
      // Chuta o intruso para o login do admin
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. BARREIRA DE COMPRA (CLIENTES)
  if (url.startsWith('/checkout')) {
    const customerSession = request.cookies.get('trendrush_customer_session')?.value;
    if (!customerSession) {
      // Salva a URL que ele tentou acessar para devolver ele pro carrinho depois
      return NextResponse.redirect(new URL('/cliente/entrar?redirect=/checkout', request.url));
    }
  }

  return NextResponse.next();
}

// O matcher diz ao Next.js em quais rotas ele deve ativar esse "guarda-costas"
export const config = {
  matcher: ['/dashboard/:path*', '/checkout/:path*'],
};