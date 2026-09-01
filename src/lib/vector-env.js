import fs from 'node:fs'
import path from 'node:path'

/**
 * Подгружает .vector-env в process.env (не переопределяя реальные env-переменные).
 * Формат — простой KEY=VALUE, поддерживаются комментарии и кавычки.
 */
export function loadVectorEnv() {
  const envPath = path.join(process.cwd(), '.vector-env')
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!match) continue

    let value = match[2]
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(match[1] in process.env)) process.env[match[1]] = value
  }
}

export function getEmbeddingConfig() {
  return {
    url: process.env.EMBEDDING_API_URL,
    model: process.env.EMBEDDING_MODEL,
    apiKey: process.env.EMBEDDING_API_KEY || '',
  }
}

/**
 * Реранкер (вторая ступень умного поиска).
 * Если url/model не заданы — реранк просто не используется.
 * minScore: кандидаты с оценкой ниже порога считаются нерелевантными.
 */
export function getRerankConfig() {
  return {
    url: process.env.RERANK_API_URL,
    model: process.env.RERANK_MODEL,
    apiKey: process.env.RERANK_API_KEY || '',
    minScore: Number(process.env.RERANK_MIN_SCORE ?? 0.1),
  }
}
