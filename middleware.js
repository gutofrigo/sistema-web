import { NextResponse } from 'next/server'
export function middleware(request) {
  const logado = request.cookies.get('logado')
  const url = request.nextUrl.pathname
  if (url === '/login' || url.startsWith('/api/')) {
    return NextResponse.next()
  }
  if (!logado || logado.value !== 'true') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}