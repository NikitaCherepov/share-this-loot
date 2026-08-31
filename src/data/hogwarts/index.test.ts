import { availableSpellLocales, getSpells } from './index'

describe('hogwarts data loader', () => {
  it('returns russian spells for ru locale', () => {
    const spells = getSpells('ru')
    expect(spells.length).toBeGreaterThan(0)
    expect(spells[0]).toMatchObject({
      name: expect.any(String),
      type: expect.any(String),
      level: expect.any(Number),
      ritual: expect.any(Boolean),
      keywords: expect.any(Array),
      description: expect.any(String),
    })
  })

  it('falls back to russian data for unknown or empty locale', () => {
    const ruSpells = getSpells('ru')
    expect(getSpells('en')).toEqual(ruSpells) // en.json пустой
    expect(getSpells('de')).toEqual(ruSpells)
  })

  it('derives available locales only from non-empty data', () => {
    // en.json пуст, поэтому доступна только ru
    expect(availableSpellLocales).toEqual(['ru'])
  })

  it('normalizes level aliases to numbers', () => {
    const spells = getSpells('ru')
    const cantrips = spells.filter((s) => s.level === 0)
    expect(cantrips.length).toBeGreaterThan(0)
    expect(spells.every((s) => Number.isInteger(s.level) && s.level >= 0)).toBe(true)
  })
})
