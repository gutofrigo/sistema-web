import { NextResponse } from 'next/server'
export function middleware(request) {
  const logado = request.cookies.get('logado')
  const autenticado = !!logado && logado.value === 'true'
  const url = request.nextUrl.pathname

  if (url === '/login' || url === '/api/login') {
    return NextResponse.next()
  }

  if (url.startsWith('/api/')) {
    if (!autenticado) {
      return NextResponse.json({ erro: 'Nao autenticado' }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (!autenticado) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}