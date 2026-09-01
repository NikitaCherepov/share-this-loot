/**
 * Реранкер для умного поиска: оценивает кандидатов относительно запроса.
 *
 * Формат запроса:
 *   POST { model, query, documents: string[], top_n }
 * Ответ (любой из вариантов):
 *   [{ index, score }]
 *   { results: [{ index, relevance_score }] }
 *
 * Пустой массив — валидный ответ («релевантных нет»).
 * Кривой формат — ошибка (не молчим).
 */

/**
 * Достаёт и нормализует список оценок из ответа реранкера.
 * Сортирует по убыванию score. Чистая функция — её проверяем тестами.
 * @throws на неожиданном формате ответа
 */
export function parseRerankResponse(json) {
  const raw = Array.isArray(json) ? json : Array.isArray(json?.results) ? json.results : null

  if (raw === null) {
    throw new Error(
      `Rerank API: неожиданный формат ответа: ${JSON.stringify(json).slice(0, 200)}`
    )
  }

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
 * @returns {Promise<Array<{ index: number, score }>>}
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

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`Rerank API ${res.status}: ${text.slice(0, 300)}`)
  }

  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(
      `Rerank API вернул не JSON (начало: ${text.slice(0, 80).replace(/\s+/g, ' ')}) — проверь RERANK_API_URL`
    )
  }

  return parseRerankResponse(json)
}
