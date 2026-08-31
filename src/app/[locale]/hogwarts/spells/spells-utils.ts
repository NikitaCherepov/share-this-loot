import type { Spell } from '@/data/hogwarts'

export type SortMode = 'level' | 'name'

export interface SpellFilters {
  search: string
  types: string[]
  levels: number[]
  castingTimes: string[]
  keywords: string[]
  ritualOnly: boolean
}

export const emptyFilters: SpellFilters = {
  search: '',
  types: [],
  levels: [],
  castingTimes: [],
  keywords: [],
  ritualOnly: false,
}

export interface FilterOptions {
  types: string[]
  levels: number[]
  castingTimes: string[]
  keywords: string[]
}

/**
 * Собирает доступные варианты фильтров из самих данных —
 * что есть в JSON, то и показываем.
 */
export function getFilterOptions(spells: Spell[]): FilterOptions {
  const types = new Set<string>()
  const levels = new Set<number>()
  const castingTimes = new Set<string>()
  const keywords = new Set<string>()

  for (const spell of spells) {
    if (spell.type && spell.type !== '—') types.add(spell.type)
    if (spell.castingTime && spell.castingTime !== '—') castingTimes.add(spell.castingTime)
    levels.add(spell.level)
    for (const keyword of spell.keywords) keywords.add(keyword)
  }

  return {
    types: [...types].sort((a, b) => a.localeCompare(b, 'ru')),
    levels: [...levels].sort((a, b) => a - b),
    castingTimes: [...castingTimes].sort((a, b) => a.localeCompare(b, 'ru')),
    keywords: [...keywords].sort((a, b) => a.localeCompare(b, 'ru')),
  }
}

/**
 * Приводит текст к нижнему регистру и заменяет ё -> е,
 * чтобы поиск находил слова независимо от набора ё/е.
 * Общая для всех разделов справочника.
 */
export function normalizeSearchText(text: string): string {
  return text.trim().toLowerCase().replace(/ё/g, 'е')
}

/**
 * Фильтрует список: внутри одной группы — ИЛИ, между группами — И.
 * Поиск идёт по названию, описанию и ключевым словам.
 */
export function filterSpells(spells: Spell[], filters: SpellFilters): Spell[] {
  const query = normalizeSearchText(filters.search)

  return spells.filter((spell) => {
    if (filters.ritualOnly && !spell.ritual) return false
    if (filters.types.length > 0 && !filters.types.includes(spell.type)) return false
    if (filters.levels.length > 0 && !filters.levels.includes(spell.level)) return false
    if (filters.castingTimes.length > 0 && !filters.castingTimes.includes(spell.castingTime)) {
      return false
    }
    if (
      filters.keywords.length > 0 &&
      !filters.keywords.some((keyword) => spell.keywords.includes(keyword))
    ) {
      return false
    }

    if (query) {
      const haystack = normalizeSearchText(
        `${spell.name} ${spell.description} ${spell.keywords.join(' ')}`
      )
      if (!haystack.includes(query)) return false
    }

    return true
  })
}

export function sortSpells(spells: Spell[], mode: SortMode): Spell[] {
  const copy = [...spells]

  if (mode === 'level') {
    copy.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'ru'))
  } else {
    copy.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }

  return copy
}

export function activeFiltersCount(filters: SpellFilters): number {
  return (
    (filters.search.trim() ? 1 : 0) +
    filters.types.length +
    filters.levels.length +
    filters.castingTimes.length +
    filters.keywords.length +
    (filters.ritualOnly ? 1 : 0)
  )
}
