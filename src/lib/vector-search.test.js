import { cosineSimilarity, rankBySimilarity } from './vector-search'

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
  })

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1)
  })

  it('handles scale differences (normalized)', () => {
    expect(cosineSimilarity([3, 4], [30, 40])).toBeCloseTo(1)
  })

  it('returns 0 for zero or mismatched vectors', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0)
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0)
    expect(cosineSimilarity([], [])).toBe(0)
  })
})

describe('rankBySimilarity', () => {
  const queryVector = [1, 0]

  const spellVectors = [
    { id: 'orthogonal', vector: [0, 5] },
    { id: 'best', vector: [9, 1] },
    { id: 'opposite', vector: [-3, 0] },
    { id: 'good', vector: [4, 3] },
  ]

  it('sorts by score descending', () => {
    const ranked = rankBySimilarity(queryVector, spellVectors)
    expect(ranked.map((r) => r.id)).toEqual(['best', 'good', 'orthogonal', 'opposite'])
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score)
  })

  it('returns only top N', () => {
    const ranked = rankBySimilarity(queryVector, spellVectors, 2)
    expect(ranked).toHaveLength(2)
    expect(ranked.map((r) => r.id)).toEqual(['best', 'good'])
  })

  it('handles empty list', () => {
    expect(rankBySimilarity(queryVector, [])).toEqual([])
  })
})
