import { NextResponse, type NextRequest } from 'next/server';
import { nonceCsp } from '@/lib/security-headers';

/**
 * Un nonce por petición: Next lo lee del encabezado de la petición para marcar
 * sus scripts en línea, y la respuesta lleva la CSP que solo acepta esos.
 */
export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const csp = nonceCsp(nonce, process.env.NODE_ENV !== 'production');
  const headers = new Headers(request.headers);
  headers.set('Content-Security-Policy', csp);
  headers.set('x-nonce', nonce);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  // Páginas, no API ni estáticos: las API responden JSON y llevan la CSP fija.
  matcher: [{ source: '/((?!api/|_next/static|_next/image|favicon.ico).*)' }],
};
