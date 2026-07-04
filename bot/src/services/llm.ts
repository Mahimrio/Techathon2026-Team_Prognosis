const LLM_API_KEY = process.env.LLM_API_KEY

interface DeepSeekResponse {
  choices: { message: { content: string } }[]
}

const validateApiKey = (key: string | undefined): boolean => {
  if (!key || key.trim().length === 0) {
    console.error('[llm] LLM_API_KEY is empty or missing')
    return false
  }
  if (key.includes(' ')) {
    console.error('[llm] LLM_API_KEY contains whitespace — check for leading/trailing spaces')
    return false
  }
  return true
}

export const humanize = async (text: string): Promise<string> => {
  if (!validateApiKey(LLM_API_KEY)) return text

  const bearer = `Bearer ${LLM_API_KEY!.trim()}`
  console.log('[llm] Authorization header prefix OK — "Bearer" present, key length:', LLM_API_KEY!.trim().length)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: bearer,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that rewrites structured data into one friendly Discord sentence. Never invent or change numbers — only rephrase the exact facts provided.',
          },
          { role: 'user', content: text },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const body = await res.text().catch(() => '(unable to read body)')
      console.error('LLM API Error:', res.status, body)
      return text
    }

    const data = (await res.json()) as DeepSeekResponse
    const content = data.choices?.[0]?.message?.content
    return content?.trim() || text
  } catch (err) {
    console.error('LLM API Error:', (err as any)?.response?.status, (err as any)?.response?.data || (err instanceof Error ? err.message : String(err)))
    return text
  }
}
