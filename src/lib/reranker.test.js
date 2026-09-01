import { parseRerankResponse, rerankDocuments } from './reranker'

describe('parseRerankResponse', () => {
  it('понимает голый массив [{index, score}]', () => {
    expect(
      parseRerankResponse([
        { index: 1, score: 0.71 },
        { index: 0, score: 0.94 },
      ])
    ).toEqual([
      { index: 0, score: 0.94 },
      { index: 1, score: 0.71 },
    ])
  })

  it('понимает { results: [{ index, relevance_score }] }', () => {
    expect(
      parseRerankResponse({ results: [{ index: 2, relevance_score: 0.5 }] })
    ).toEqual([{ index: 2, score: 0.5 }])
  })

  it('сортирует по убыванию score', () => {
    const ranked = parseRerankResponse([
      { index: 0, score: 0.1 },
      { index: 1, score: 0.9 },
      { index: 2, score: 0.5 },
    ])

    expect(ranked.map((r) => r.index)).toEqual([1, 2, 0])
  })

  it('выкидывает мусорные записи', () => {
    expect(
      parseRerankResponse([
        { index: 0, score: 0.9 },
        { index: 'хвост', score: 0.5 },
        { index: 1 },
        null,
      ])
    ).toEqual([{ index: 0, score: 0.9 }])
  })

  it('пустой массив — валидный ответ («релевантных нет»)', () => {
    expect(parseRerankResponse([])).toEqual([])
  })

  it('{ results: [] } — тоже валидный пустой ответ', () => {
    expect(parseRerankResponse({ results: [] })).toEqual([])
  })

  it.each([null, {}, { results: 'нет' }, 'строка'])(
    'кидает ошибку на неожиданный формат: %s',
    (payload) => {
      expect(() => parseRerankResponse(payload)).toThrow('неожиданный формат')
    }
  )
})

describe('rerankDocuments', () => {
  afterEach(() => {
    global.fetch.mockRestore?.()
  })

  function setupFetch({ ok = true, status = 200, body = '[]' } = {}) {
    global.fetch = jest.fn().mockResolvedValue({ ok, status, text: async () => body })
    return global.fetch
  }

  it('шлёт { model, query, documents, top_n } и возвращает оценки', async () => {
    const fetchMock = setupFetch({ body: '[{ "index": 0, "score": 0.94 }]' })

    const ranked = await rerankDocuments('Дальнобойное, бьёт больно', ['Бомбарда', 'Флипендо'], 5, {
      url: 'http://x/rerank',
      model: 'reranker',
      apiKey: 'k',
    })

    expect(ranked).toEqual([{ index: 0, score: 0.94 }])
    expect(fetchMock).toHaveBeenCalledWith(
      'http://x/rerank',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer k' }),
      })
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({
      model: 'reranker',
      query: 'Дальнобойное, бьёт больно',
      documents: ['Бомбарда', 'Флипендо'],
      top_n: 5,
    })
  })

  it('не шлёт Authorization без ключа', async () => {
    const fetchMock = setupFetch({ body: '{ "results": [{ "index": 1, "relevance_score": 0.4 }] }' })

    await rerankDocuments('q', ['a'], 1, { url: 'http://x', model: 'm', apiKey: '' })

    expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('падает с внятной ошибкой на плохой статус', async () => {
    setupFetch({ ok: false, status: 502, body: 'bad gateway' })

    await expect(
      rerankDocuments('q', ['a'], 1, { url: 'http://x', model: 'm', apiKey: '' })
    ).rejects.toThrow('Rerank API 502')
  })

  it('HTML вместо JSON — ошибка с подсказкой про RERANK_API_URL', async () => {
    setupFetch({ body: '<!DOCTYPE html><html>oops</html>' })

    const error = await rerankDocuments('q', ['a'], 1, {
      url: 'http://x',
      model: 'm',
      apiKey: '',
    }).catch((e) => e)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toMatch(/не JSON/)
    expect(error.message).toMatch(/RERANK_API_URL/)
  })

  it('пустой массив от API — не ошибка', async () => {
    setupFetch({ body: '[]' })

    await expect(
      rerankDocuments('q', ['a'], 1, { url: 'http://x', model: 'm', apiKey: '' })
    ).resolves.toEqual([])
  })
})
