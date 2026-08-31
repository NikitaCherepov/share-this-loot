import type { Trait } from '@/data/hogwarts/traits'
import {
  activeTraitFiltersCount,
  emptyTraitFilters,
  filterTraits,
  getTraitFilterOptions,
  sortTraitsByName,
} from './traits-utils'

const traits: Trait[] = [
  {
    id: '1',
    name: 'Змееуст',
    type: 'Врождённая',
    characteristics: [],
    skills: ['Запугивание'],
    description: 'Говорите на змеином языке',
  },
  {
    id: '2',
    name: 'Мастер зелий',
    type: 'Стандартная',
    characteristics: ['Интеллект'],
    skills: ['Природа'],
    description: 'Варите зелья',
  },
  {
    id: '3',
    name: 'Дуэлянт',
    type: 'Стандартная',
    characteristics: ['Ловкость', 'Харизма'],
    skills: ['Акробатика'],
    description: 'Уклоняетесь от заклинаний',
  },
]

describe('getTraitFilterOptions', () => {
  it('собирает уникальные типы, характеристики и навыки из данных', () => {
    const options = getTraitFilterOptions(traits)

    expect(options.types).toEqual(['Врождённая', 'Стандартная'])
    expect(options.characteristics).toEqual(['Интеллект', 'Ловкость', 'Харизма'])
    expect(options.skills).toEqual(['Акробатика', 'Запугивание', 'Природа'])
  })

  it('игнорирует заглушечный тип', () => {
    expect(
      getTraitFilterOptions([{ ...traits[0], type: '—' }]).types
    ).toEqual([])
  })
})

describe('filterTraits', () => {
  it('возвращает всё без фильтров', () => {
    expect(filterTraits(traits, emptyTraitFilters)).toHaveLength(3)
  })

  it('фильтрует по типу', () => {
    const result = filterTraits(traits, { ...emptyTraitFilters, types: ['Врождённая'] })

    expect(result.map((t) => t.id)).toEqual(['1'])
  })

  it('внутри группы характеристик — ИЛИ', () => {
    const result = filterTraits(traits, {
      ...emptyTraitFilters,
      characteristics: ['Интеллект', 'Ловкость'],
    })

    expect(result.map((t) => t.id)).toEqual(['2', '3'])
  })

  it('между группами — И', () => {
    const result = filterTraits(traits, {
      ...emptyTraitFilters,
      types: ['Стандартная'],
      skills: ['Природа'],
    })

    expect(result.map((t) => t.id)).toEqual(['2'])
  })

  it('ищет по названию, описанию, характеристикам и навыкам', () => {
    const byName = filterTraits(traits, { ...emptyTraitFilters, search: 'змеи' })
    const byDescription = filterTraits(traits, { ...emptyTraitFilters, search: 'зелья' })
    const byCharacteristic = filterTraits(traits, { ...emptyTraitFilters, search: 'харизма' })
    const bySkill = filterTraits(traits, { ...emptyTraitFilters, search: 'акробатика' })

    expect(byName.map((t) => t.id)).toEqual(['1'])
    expect(byDescription.map((t) => t.id)).toEqual(['2'])
    expect(byCharacteristic.map((t) => t.id)).toEqual(['3'])
    expect(bySkill.map((t) => t.id)).toEqual(['3'])
  })

  it('поиск не зависит от ё/е', () => {
    const result = filterTraits(traits, { ...emptyTraitFilters, search: 'врожденная' })

    expect(result.map((t) => t.id)).toEqual(['1'])
  })
})

describe('sortTraitsByName', () => {
  it('сортирует по алфавиту', () => {
    const result = sortTraitsByName([...traits].reverse())

    expect(result.map((t) => t.name)).toEqual(['Дуэлянт', 'Змееуст', 'Мастер зелий'])
  })

  it('не мутирует входный массив', () => {
    const input = [...traits]
    sortTraitsByName(input)

    expect(input).toEqual(traits)
  })
})

describe('activeTraitFiltersCount', () => {
  it('считает активные фильтры', () => {
    expect(activeTraitFiltersCount(emptyTraitFilters)).toBe(0)

    expect(
      activeTraitFiltersCount({
        search: '  ',
        types: ['Стандартная'],
        characteristics: ['Ловкость'],
        skills: [],
      })
    ).toBe(2)

    expect(
      activeTraitFiltersCount({
        search: 'змея',
        types: [],
        characteristics: [],
        skills: ['Природа', 'Акробатика'],
      })
    ).toBe(3)
  })
})
