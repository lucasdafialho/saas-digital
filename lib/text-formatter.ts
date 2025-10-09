/**
 * Remove formatação markdown do texto gerado pela LLM
 * Remove ** (negrito), __ (itálico), ` (código), etc.
 */
export function removeMarkdownFormatting(text: string): string {
  if (!text) return text
  
  return text
    // Remove negrito: **texto** ou __texto__
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    
    // Remove itálico: *texto* ou _texto_
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    
    // Remove código inline: `texto`
    .replace(/`(.+?)`/g, '$1')
    
    // Remove blocos de código: ```texto```
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```[a-zA-Z]*\n?|```/g, '')
    })
    
    // Remove links markdown: [texto](url)
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    
    // Remove títulos markdown: # Título
    .replace(/^#{1,6}\s+/gm, '')
    
    // Remove listas markdown: - item ou * item
    .replace(/^[\*\-]\s+/gm, '')
    
    // Remove citações: > texto
    .replace(/^>\s+/gm, '')
    
    .trim()
}

/**
 * Remove formatação markdown de um objeto recursivamente
 * Útil para limpar objetos JSON retornados pela LLM
 */
export function cleanMarkdownFromObject(obj: any): any {
  if (typeof obj === 'string') {
    return removeMarkdownFormatting(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanMarkdownFromObject(item))
  }
  
  if (obj && typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanMarkdownFromObject(value)
    }
    return cleaned
  }
  
  return obj
}
