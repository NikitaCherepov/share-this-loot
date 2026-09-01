/**
 * Реранкер для умного поиска: оценивает кандидатов относительно запроса.
 *
 * Формат запроса:
 *   POST { model, query, documents: string[], top_n }
 * Ответ (любой из вариантов):
 *   [{ index, score }]
 *   { results: [{ index, relevance_score }] }
 */

/**
 * Достаёт и нормализует список оценок из ответа реранкера.
 * Сортирует по убыванию score. Чистая функция — её проверяем тестами.
 */
export function parseRerankResponse(json) {
  const raw = Array.isArray(json) ? json : Array.isArray(json?.results) ? json.results : []

  return raw
    .map((entry) => ({
      index: Number(entry?.index),
      score: Number(
        entry?.score ?? entry?.relevance_score ?? entry?.relevanceScore ?? entry?.relevance
      ),
    }))
    .filter(
      (entry) => Number.isInteger(entry.index) && entry.index >= 0 && Number.isFinite(entry.score)
    )
    .sort((a, b) => b.score - a.score)
}

/**
 * Отправляет кандидатов на реранк.
 * @returns {Promise<Array<{ index: number, score: number }>>}
 */
export async function rerankDocuments(query, documents, topN, { url, model, apiKey }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, query, documents, top_n: topN }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Rerank API ${res.status}: ${body.slice(0, 300)}`)
  }

  return parseRerankResponse(await res.json())
}
