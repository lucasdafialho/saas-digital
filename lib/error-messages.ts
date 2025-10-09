// Mensagens de erro amigáveis para o usuário
export const ERROR_MESSAGES = {
  // Erros de autenticação
  'Invalid login credentials': 'Email ou senha incorretos. Verifique seus dados e tente novamente.',
  'Email not confirmed': 'Por favor, confirme seu email antes de fazer login.',
  'User already registered': 'Este email já está cadastrado. Faça login ou recupere sua senha.',
  'Invalid email': 'Por favor, insira um email válido.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.',
  'Password should be at least 8 characters': 'A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.',
  'Password should contain at least one character': 'A senha deve incluir letras maiúsculas, minúsculas, números e caracteres especiais (!@#$%...).',
  'Signup requires a valid password': 'A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.',
  'User not found': 'Usuário não encontrado. Verifique o email digitado.',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  
  // Erros de rede
  'Failed to fetch': 'Erro de conexão. Verifique sua internet e tente novamente.',
  'Network request failed': 'Erro de conexão. Verifique sua internet e tente novamente.',
  'NetworkError': 'Erro de conexão. Verifique sua internet e tente novamente.',
  
  // Erros de validação
  'Email and password are required': 'Por favor, preencha email e senha.',
  'Name, email and password are required': 'Por favor, preencha todos os campos obrigatórios.',
  'Passwords do not match': 'As senhas não coincidem.',
  'Invalid password': 'Senha inválida. Use pelo menos 6 caracteres.',
  
  // Erros de rate limit
  'Too many requests': 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  'Rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  
  // Erros genéricos
  'Internal server error': 'Ocorreu um erro. Por favor, tente novamente.',
  'Something went wrong': 'Algo deu errado. Por favor, tente novamente.',
  'An error occurred': 'Ocorreu um erro. Por favor, tente novamente.',
  
  // Erro padrão
  default: 'Ocorreu um erro inesperado. Por favor, tente novamente.'
} as const

export function getErrorMessage(error: unknown): string {
  // Se for uma string, procura por mensagem correspondente
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] || error
  }
  
  // Se for um objeto Error
  if (error instanceof Error) {
    const message = error.message
    
    // Procura por mensagens conhecidas
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }
    
    return message || ERROR_MESSAGES.default
  }
  
  // Se for um objeto com propriedade error
  if (error && typeof error === 'object' && 'error' in error) {
    return getErrorMessage((error as { error: unknown }).error)
  }
  
  // Se for um objeto com propriedade message
  if (error && typeof error === 'object' && 'message' in error) {
    return getErrorMessage((error as { message: unknown }).message)
  }
  
  return ERROR_MESSAGES.default
}

// Valida email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Valida senha com requisitos detalhados
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres.' }
  }
  
  if (password.length > 72) {
    return { valid: false, message: 'A senha deve ter no máximo 72 caracteres.' }
  }
  
  return { valid: true }
}

// Verifica requisitos individuais da senha
export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password)
  }
}

// Calcula força da senha
export function getPasswordStrength(password: string): { strength: number; label: string; color: string } {
  if (!password) return { strength: 0, label: '', color: '' }
  
  let strength = 0
  const requirements = getPasswordRequirements(password)
  
  if (requirements.minLength) strength++
  if (requirements.hasUpperCase) strength++
  if (requirements.hasLowerCase) strength++
  if (requirements.hasNumber) strength++
  if (requirements.hasSpecialChar) strength++
  
  if (strength <= 2) {
    return { strength, label: 'Fraca', color: 'bg-red-500' }
  } else if (strength === 3) {
    return { strength, label: 'Média', color: 'bg-yellow-500' }
  } else if (strength === 4) {
    return { strength, label: 'Boa', color: 'bg-blue-500' }
  } else {
    return { strength, label: 'Forte', color: 'bg-green-500' }
  }
}

// Valida nome
export function isValidName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim().length < 2) {
    return { valid: false, message: 'O nome deve ter pelo menos 2 caracteres.' }
  }
  
  if (name.length > 100) {
    return { valid: false, message: 'O nome deve ter no máximo 100 caracteres.' }
  }
  
  return { valid: true }
}

// Gera mensagem de erro específica sobre o que falta na senha
export function getPasswordErrorMessage(password: string): string | null {
  const reqs = getPasswordRequirements(password)
  const missing: string[] = []
  
  if (!reqs.minLength) {
    missing.push('pelo menos 8 caracteres')
  }
  if (!reqs.hasUpperCase) {
    missing.push('uma letra maiúscula (A-Z)')
  }
  if (!reqs.hasLowerCase) {
    missing.push('uma letra minúscula (a-z)')
  }
  if (!reqs.hasNumber) {
    missing.push('um número (0-9)')
  }
  if (!reqs.hasSpecialChar) {
    missing.push('um caractere especial (!@#$%...)')
  }
  
  if (missing.length === 0) {
    return null // Senha válida
  }
  
  if (missing.length === 1) {
    return `Sua senha precisa de ${missing[0]}.`
  }
  
  if (missing.length === 2) {
    return `Sua senha precisa de ${missing[0]} e ${missing[1]}.`
  }
  
  const lastItem = missing.pop()
  return `Sua senha precisa de ${missing.join(', ')} e ${lastItem}.`
}
