import { NextResponse } from 'next/server'
import { getSpells } from '@/data/hogwarts'
import { getTraits } from '@/data/hogwarts/traits'
import { getVectors } from '@/data/hogwarts/vectors'
import { loadVectorEnv, getEmbeddingConfig, getRerankConfig } from '@/lib/vector-env'
import { embedText } from '@/lib/embedding'
import { rankBySimilarity } from '@/lib/vector-search'
import { checkRateLimit } from '@/lib/rate-limit'
import { rerankDocuments } from '@/lib/reranker'

/** Минимальный интервал между поисками с одного IP */
const RATE_LIMIT_MS = 2000

/** Сколько отдавать, если реранкер не настроен */
const EMBEDDING_TOP_N = 10
/** Кандидаты для реранкера (первая ступень) */
const RERANK_CANDIDATES = 20
/** Сколько отдавать после реранка (вторая ступень) */
const RERANK_TOP_N = 5

/** Достаёт ip клиента из заголовков (next start сидит за прокси или напрямую) */
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'local'
}

/** Тексты кандидатов для реранкера: тот же объект, что уходил в векторизацию */
function getCandidateTexts(section, locale, ids) {
  const entries = section === 'traits' ? getTraits(locale) : getSpells(locale)
  const byId = new Map(entries.map((entry) => [entry.id, entry]))

  return ids
    .map((id) => {
      const entry = byId.get(id)
      if (!entry) return null
      const { id: _omit, ...rest } = entry
      return { id, text: JSON.stringify(rest) }
    })
    .filter((candidate) => candidate !== null)
}

/**
 * Умный поиск по разделам справочника:
 *   POST { query: string, locale?: string, section?: 'spells' | 'traits' }
 *   -> { results: [{ id, score }], indexed: number }
 *
 * Не чаще одного запроса в RATE_LIMIT_MS с одного IP.
 *
 * Две ступени:
 *   1) запрос векторизуется через embedding-модель (настройки в .vector-env),
 *      косинусной близостью отбираются топ-RERANK_CANDIDATES кандидатов;
 *   2) если настроен реранкер (RERANK_API_URL/RERANK_MODEL) — каждый кандидат
 *      оценивается относительно запроса, сортируется по score, явно нерелевантные
 *      (ниже RERANK_MIN_SCORE) отбрасываются, возвращается топ-RERANK_TOP_N.
 *
 * Без реранкера (или если он упал) — обычный embedding-топ EMBEDDING_TOP_N.
 */
export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const query = String(body?.query ?? '').trim()
  const locale = String(body?.locale ?? 'ru')
  const section = body?.section === 'traits' ? 'traits' : 'spells'

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const { allowed, retryAfterMs } = checkRateLimit(
    `smart-search:${getClientIp(request)}`,
    RATE_LIMIT_MS
  )
  if (!allowed) {
    return NextResponse.json(
      { error: 'too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }
    )
  }

  const vectors = getVectors(section, locale)
  if (vectors.length === 0) {
    return NextResponse.json({ results: [], indexed: 0 })
  }

  loadVectorEnv()
  const embeddingConfig = getEmbeddingConfig()

  if (!embeddingConfig.url || !embeddingConfig.model) {
    return NextResponse.json(
      { error: 'embedding is not configured (.vector-env)' },
      { status: 500 }
    )
  }

  let queryVector
  try {
    queryVector = await embedText(query, embeddingConfig)
  } catch (error) {
    return NextResponse.json(
      { error: error?.message ? String(error.message) : 'embedding failed' },
      { status: 500 }
    )
  }

  // fallback-вариант: топ по косинусной близости
  let results = rankBySimilarity(queryVector, vectors, EMBEDDING_TOP_N)

  const rerankConfig = getRerankConfig()
  if (rerankConfig.url && rerankConfig.model) {
    try {
      // 1-я ступень: кандидаты по эмбеддингам
      const candidates = rankBySimilarity(queryVector, vectors, RERANK_CANDIDATES)
      const texts = getCandidateTexts(
        section,
        locale,
        candidates.map((candidate) => candidate.id)
      )

      // 2-я ступень: реранк относительно исходного запроса
      const ranked = await rerankDocuments(
        query,
        texts.map((candidate) => candidate.text),
        RERANK_TOP_N,
        rerankConfig
      )

      const reranked = ranked
        // отбрасываем явно нерелевантных и битые индексы
        .filter((entry) => entry.score >= rerankConfig.minScore)
        .map((entry) => ({ id: texts[entry.index]?.id, score: entry.score }))
        .filter((entry) => entry.id !== undefined)

      if (reranked.length > 0) results = reranked
    } catch (error) {
      // реранкер упал — не беда, отдаём embedding-топ
      console.error('rerank failed, falling back to embeddings:', error?.message)
    }
  }

  return NextResponse.json({ results, indexed: vectors.length })
}
