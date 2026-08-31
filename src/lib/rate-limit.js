const hits = new Map()

/**
 * Простой rate-limit в памяти: не чаще одного раза в intervalMs по ключу.
 * Живёт в рамках одного процесса — для next start этого достаточно.
 *
 * @param {string} key — обычно ip клиента
 * @param {number} intervalMs — минимальный интервал между запросами
 * @param {number} now — текущее время (инъектится в тестах)
 * @returns {{ allowed: boolean, retryAfterMs: number }}
 */
export function checkRateLimit(key, intervalMs, now = Date.now()) {
  const last = hits.get(key)

  if (last !== undefined) {
    const elapsed = now - last
    if (elapsed < intervalMs) {
      return { allowed: false, retryAfterMs: intervalMs - elapsed }
    }
  }

  hits.set(key, now)

  // не даём карте расти бесконечно — подчищаем просроченные
  if (hits.size > 1000) {
    for (const [k, timestamp] of hits) {
      if (now - timestamp >= intervalMs) hits.delete(k)
    }
  }

  return { allowed: true, retryAfterMs: 0 }
}
