/**
 * Косинусная близость: cos(θ) = (A·B) / (|A|·|B|)
 */
export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
    return 0
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Ранжирует заклинания по похожести на запрос и берёт топ-N.
 */
export function rankBySimilarity(queryVector, spellVectors, topN = 10) {
  return spellVectors
    .map((spell) => ({
      id: spell.id,
      score: cosineSimilarity(queryVector, spell.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}
