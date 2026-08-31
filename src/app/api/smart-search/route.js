import { NextResponse } from 'next/server'
import { getVectors } from '@/data/hogwarts/vectors'
import { loadVectorEnv, getEmbeddingConfig } from '@/lib/vector-env'
import { embedText } from '@/lib/embedding'
import { rankBySimilarity } from '@/lib/vector-search'

/**
 * Умный поиск по разделам справочника:
 *   POST { query: string, locale?: string, section?: 'spells' | 'traits' }
 *   -> { results: [{ id, score }], indexed: number }
 *
 * Запрос векторизуется через embedding-модель (настройки в .vector-env),
 * сравнивается косинусной близостью с векторами раздела,
 * возвращаются топ-10 по убыванию score.
 */
export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const query = String(body?.query ?? '').trim()
  const locale = String(body?.locale ?? 'ru')
  const section = body?.section === 'traits' ? 'traits' : 'spells'

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const vectors = getVectors(section, locale)
  if (vectors.length === 0) {
    return NextResponse.json({ results: [], indexed: 0 })
  }

  loadVectorEnv()
  const config = getEmbeddingConfig()

  if (!config.url || !config.model) {
    return NextResponse.json(
      { error: 'embedding is not configured (.vector-env)' },
      { status: 500 }
    )
  }

  try {
    const queryVector = await embedText(query, config)
    const results = rankBySimilarity(queryVector, vectors, 10)

    return NextResponse.json({ results, indexed: vectors.length })
  } catch (error) {
    return NextResponse.json(
      { error: error?.message ? String(error.message) : 'embedding failed' },
      { status: 500 }
    )
  }
}
