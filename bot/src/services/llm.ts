const LLM_API_KEY = process.env.LLM_API_KEY

interface DeepSeekResponse {
  choices: { message: { content: string } }[]
}

export const humanize = async (text: string): Promise<string> => {
  if (!LLM_API_KEY) return text

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_API_KEY}`,
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

    if (!res.ok) return text

    const data = (await res.json()) as DeepSeekResponse
    const content = data.choices?.[0]?.message?.content
    return content?.trim() || text
  } catch {
    return text
  }
}
