import OpenAI from 'openai'
import env from '#start/env'
import ExternalApiException from '#exceptions/external_api_exception'

export interface PromoDetails {
  code: string | null
  discountRaw: string | null
  brand: string | null
  summary: string | null
  category: string
  url: string | null
  expiresAt: string | null
  confidence: number
}

export default class OpenAIService {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: env.get('OPENAI_API_KEY'),
    })
  }

  /**
   * Extract promo details from email content using OpenAI Assistant
   */
  async extractPromoDetails(
    subject: string,
    sender: string,
    body: string
  ): Promise<PromoDetails | null> {
    try {
      const assistantId = env.get('OPENAI_ASSISTANT_ID')

      if (!assistantId) {
        throw ExternalApiException.openaiApiFailed('OPENAI_ASSISTANT_ID is not configured')
      }

      return this.extractWithAssistant(assistantId, subject, sender, body)
    } catch (error) {
      if (error instanceof ExternalApiException) {
        throw error
      }

      console.error('OpenAI extraction failed:', error)
      return null
    }
  }

  private formatUserMessage(subject: string, sender: string, body: string): string {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.toLocaleDateString('en-US', { month: 'long' })
    const day = today.getDate()

    return `
CURRENT DATE: ${month} ${day}, ${year}
CURRENT YEAR: ${year}

Subject: ${subject}
Sender: ${sender}

Body:
${body}
        `.trim()
  }

  private async extractWithAssistant(
    assistantId: string,
    subject: string,
    sender: string,
    body: string
  ): Promise<PromoDetails | null> {
    try {
      // Create a thread and run the assistant
      const run = await this.client.beta.threads.createAndRun({
        assistant_id: assistantId,
        thread: {
          messages: [{ role: 'user', content: this.formatUserMessage(subject, sender, body) }],
        },
      })

      console.log('Run created:', run.id, 'Thread:', run.thread_id)

      if (!run.thread_id) {
        console.error('No thread_id in run response:', run)
        throw ExternalApiException.openaiApiFailed('Failed to create thread')
      }

      const threadId = run.thread_id

      // Poll for completion
      let runStatus = await this.client.beta.threads.runs.retrieve(run.id, { thread_id: threadId })

      // Simple polling mechanism (max 30 seconds)
      const startTime = Date.now()
      while (runStatus.status !== 'completed') {
        if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
          console.error(`Assistant run failed with status: ${runStatus.status}`)
          throw ExternalApiException.openaiApiFailed(
            `Assistant run failed with status: ${runStatus.status}`
          )
        }

        if (Date.now() - startTime > 30000) {
          console.error('Assistant run timed out')
          throw ExternalApiException.openaiTimeout()
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
        runStatus = await this.client.beta.threads.runs.retrieve(run.id, { thread_id: threadId })
      }

      // Get messages
      const messages = await this.client.beta.threads.messages.list(threadId)
      const lastMessage = messages.data.find((m) => m.role === 'assistant')

      if (!lastMessage || !lastMessage.content[0] || lastMessage.content[0].type !== 'text') {
        return null
      }

      const content = lastMessage.content[0].text.value

      // Clean up markdown code blocks if present
      const jsonStr = content.replace(/^```json\n|\n```$/g, '')

      return JSON.parse(jsonStr) as PromoDetails
    } catch (error) {
      // Re-throw if it's already our custom exception
      if (error instanceof ExternalApiException) {
        throw error
      }

      // Handle OpenAI rate limiting
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after']
        throw ExternalApiException.rateLimitExceeded('OpenAI', retryAfter)
      }

      throw ExternalApiException.openaiApiFailed(error.message || 'Unknown error')
    }
  }
}
