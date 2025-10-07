import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function getUserFromRequest(request: NextRequest): Promise<{ userId: string; email: string } | null> {
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
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value)
            })
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return {
      userId: user.id,
      email: user.email || ''
    }
  } catch (error) {
    console.error('Erro ao obter usuário da requisição:', error)
    return null
  }
}
