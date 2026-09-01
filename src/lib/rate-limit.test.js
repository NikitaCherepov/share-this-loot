import { checkRateLimit } from './rate-limit'

const INTERVAL = 5000

// карта хранится в модуле, поэтому ключи между тестами не пересекаем
describe('checkRateLimit', () => {
  it('пропускает первый запрос', () => {
    expect(checkRateLimit('ip-first', INTERVAL, 1000)).toEqual({ allowed: true, retryAfterMs: 0 })
  })

  it('режет повторный запрос раньше интервала', () => {
    checkRateLimit('ip-fast', INTERVAL, 1000)

    const result = checkRateLimit('ip-fast', INTERVAL, 2500)

    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBe(3500)
  })

  it('пропускает после истечения интервала', () => {
    checkRateLimit('ip-slow', INTERVAL, 1000)

    expect(checkRateLimit('ip-slow', INTERVAL, 6000).allowed).toBe(true)
  })

  it('ключи независимы друг от друга', () => {
    checkRateLimit('ip-one', INTERVAL, 1000)

    expect(checkRateLimit('ip-two', INTERVAL, 1500).allowed).toBe(true)
    expect(checkRateLimit('ip-one', INTERVAL, 1500).allowed).toBe(false)
  })

  it('не пускает прошедший запрос заново без нового интервала', () => {
    checkRateLimit('ip-chain', INTERVAL, 1000)
    checkRateLimit('ip-chain', INTERVAL, 6000) // пропущен и записан

    expect(checkRateLimit('ip-chain', INTERVAL, 6500).allowed).toBe(false)
  })
})
