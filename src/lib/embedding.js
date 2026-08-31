/**
 * Запрос к OpenAI-совместимому embeddings-эндпоинту.
 * Работает с Ollama (/v1/embeddings), LM Studio, vLLM, OpenAI и т.п.
 */
export async function embedText(text, { url, model, apiKey }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, input: text }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Embedding API ${res.status}: ${body.slice(0, 300)}`)
  }

  const json = await res.json()
  const vector =
    json?.data?.[0]?.embedding ?? json?.embedding ?? (Array.isArray(json?.[0]) ? json[0] : null)

  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error(`Unexpected embedding response: ${JSON.stringify(json).slice(0, 300)}`)
  }

  return vector
}
