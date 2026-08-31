import type { Spell } from '@/data/hogwarts'
import {
  activeFiltersCount,
  emptyFilters,
  filterSpells,
  getFilterOptions,
  sortSpells,
} from './spells-utils'

const spells: Spell[] = [
  {
    id: 'a',
    name: 'Авада Кедавра',
    type: 'Непростительное проклятие',
    level: 5,
    castingTime: '1 действие',
    range: '18 метров',
    duration: 'Мгновенная',
    ritual: false,
    keywords: ['смерть', 'тёмная магия'],
    description: 'Убивает цель мгновенно.',
  },
  {
    id: 'b',
    name: 'Люмос',
    type: 'Чары',
    level: 0,
    castingTime: '1 бонусное действие',
    range: 'На себя',
    duration: 'До 1 минуты',
    ritual: false,
    keywords: ['свет'],
    description: 'Зажигает огонёк на конце палочки.',
  },
  {
    id: 'c',
    name: 'Фиделиус',
    type: 'Чары',
    level: 5,
    castingTime: '1 час',
    range: 'Касание',
    duration: 'Пока не развеется',
    ritual: true,
    keywords: ['защита', 'скрытие'],
    description: 'Скрывает тайну внутри Хранителя.',
  },
]

describe('getFilterOptions', () => {
  it('collects unique options from data', () => {
    const options = getFilterOptions(spells)

    expect(options.types).toEqual(['Непростительное проклятие', 'Чары']) // отсортировано
    expect(options.levels).toEqual([0, 5])
    expect(options.castingTimes).toEqual(['1 бонусное действие', '1 действие', '1 час'])
    expect(options.keywords).toEqual(['защита', 'свет', 'скрытие', 'смерть', 'тёмная магия'])
  })
})

describe('filterSpells', () => {
  it('returns everything with empty filters', () => {
    expect(filterSpells(spells, emptyFilters)).toHaveLength(3)
  })

  it('filters by type', () => {
    const result = filterSpells(spells, { ...emptyFilters, types: ['Чары'] })
    expect(result.map((s) => s.id)).toEqual(['b', 'c'])
  })

  it('combines groups with AND', () => {
    const result = filterSpells(spells, {
      ...emptyFilters,
      types: ['Чары'],
      levels: [5],
    })
    expect(result.map((s) => s.id)).toEqual(['c'])
  })

  it('OR within a group', () => {
    const result = filterSpells(spells, {
      ...emptyFilters,
      keywords: ['свет', 'смерть'],
    })
    expect(result.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('filters ritual only', () => {
    const result = filterSpells(spells, { ...emptyFilters, ritualOnly: true })
    expect(result.map((s) => s.id)).toEqual(['c'])
  })

  it('searches by name case-insensitive', () => {
    const result = filterSpells(spells, { ...emptyFilters, search: 'люмос' })
    expect(result.map((s) => s.id)).toEqual(['b'])
  })

  it('searches by description and keywords', () => {
    const byDescription = filterSpells(spells, { ...emptyFilters, search: 'хранител' })
    const byKeyword = filterSpells(spells, { ...emptyFilters, search: 'ТЕМНАЯ' })
    expect(byDescription.map((s) => s.id)).toEqual(['c'])
    expect(byKeyword.map((s) => s.id)).toEqual(['a'])
  })

  it('returns empty when nothing matches', () => {
    expect(filterSpells(spells, { ...emptyFilters, search: 'круцио' })).toHaveLength(0)
  })
})

describe('sortSpells', () => {
  it('sorts by level then name', () => {
    // Люмос (0), затем Авада и Фиделиус (оба 5 ур., по алфавиту А < Ф)
    const result = sortSpells(spells, 'level')
    expect(result.map((s) => s.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts alphabetically', () => {
    const result = sortSpells(spells, 'name')
    expect(result.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the source array', () => {
    const source = [...spells]
    sortSpells(spells, 'name')
    expect(spells.map((s) => s.id)).toEqual(source.map((s) => s.id))
  })
})

describe('activeFiltersCount', () => {
  it('is zero for empty filters', () => {
    expect(activeFiltersCount(emptyFilters)).toBe(0)
  })

  it('counts search, selections and ritual toggle', () => {
    expect(
      activeFiltersCount({
        ...emptyFilters,
        search: '  патронус ',
        types: ['Чары'],
        levels: [0, 1],
        ritualOnly: true,
      })
    ).toBe(5)
  })

  it('ignores whitespace-only search', () => {
    expect(activeFiltersCount({ ...emptyFilters, search: '   ' })).toBe(0)
  })
})
