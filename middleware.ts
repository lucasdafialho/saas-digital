import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Permitir acesso livre a páginas públicas e API
  const publicPaths = ['/', '/login', '/register', '/legal', '/guia-rapido']
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path))
  const isApiRoute = pathname.startsWith('/api')
  const isAuthCallback = pathname.startsWith('/auth/callback')
  
  if (isPublicPath || isApiRoute || isAuthCallback) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    const isDashboard = pathname.startsWith('/dashboard')

    // Se tentar acessar dashboard sem estar logado, redireciona para login
    if (!session && isDashboard) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error('[MIDDLEWARE] Erro:', error)
    // Em caso de erro, permite o acesso e deixa o cliente lidar com a autenticação
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
