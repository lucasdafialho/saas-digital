import { supabase, type Profile } from './supabase'

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, plan, generations_used, created_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  const typedProfile = profile as unknown as Profile

  return {
    id: typedProfile.id,
    email: typedProfile.email,
    name: typedProfile.name,
    plan: typedProfile.plan,
    generationsUsed: typedProfile.generations_used,
    createdAt: typedProfile.created_at
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Não autenticado')
  }

  return user
}

export async function requirePlan(minPlan: 'free' | 'starter' | 'pro') {
  const user = await requireAuth()
  
  const planHierarchy: Record<'free' | 'starter' | 'pro', number> = {
    free: 0,
    starter: 1,
    pro: 2
  }

  const userPlanLevel = planHierarchy[user.plan as 'free' | 'starter' | 'pro']
  const minPlanLevel = planHierarchy[minPlan]

  if (userPlanLevel < minPlanLevel) {
    throw new Error(`Plano ${minPlan} ou superior necessário`)
  }

  return user
}
