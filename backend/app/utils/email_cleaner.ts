/**
 * Utility functions for cleaning and truncating email content
 */

/**
 * Strip HTML tags and decode entities
 */
export function stripHtml(html: string): string {
  if (!html) return ''

  // Remove script and style tags with their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#039;/g, "'")

  // Remove multiple spaces and newlines
  text = text.replace(/\s+/g, ' ')

  // Trim
  return text.trim()
}

/**
 * Truncate text to a maximum length while trying to keep complete words
 */
export function truncateText(text: string, maxLength: number = 8000): string {
  if (!text || text.length <= maxLength) return text

  // Try to cut at a word boundary
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    // If we can find a space in the last 20%, cut there
    return truncated.substring(0, lastSpace) + '...'
  }

  // Otherwise just cut at maxLength
  return truncated + '...'
}

/**
 * Clean and prepare email content for AI processing
 * Strips HTML, truncates, and ensures reasonable size
 */
export function cleanEmailForAI(
  subject: string,
  snippet: string,
  body: string
): { subject: string; snippet: string; body: string } {
  // Clean the body: strip HTML and truncate
  const cleanBody = stripHtml(body)
  const truncatedBody = truncateText(cleanBody, 8000)

  // Subject and snippet are usually short, but let's be safe
  const cleanSubject = stripHtml(subject).substring(0, 500)
  const cleanSnippet = stripHtml(snippet).substring(0, 1000)

  return {
    subject: cleanSubject,
    snippet: cleanSnippet,
    body: truncatedBody,
  }
}
