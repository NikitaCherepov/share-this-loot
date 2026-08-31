import type { Trait } from '@/data/hogwarts/traits'
import { normalizeSearchText } from '../spells/spells-utils'

export interface TraitFilters {
  search: string
  types: string[]
  characteristics: string[]
  skills: string[]
}

export const emptyTraitFilters: TraitFilters = {
  search: '',
  types: [],
  characteristics: [],
  skills: [],
}

export interface TraitFilterOptions {
  types: string[]
  characteristics: string[]
  skills: string[]
}

/**
 * Собирает доступные варианты фильтров из самих данных —
 * что есть в JSON, то и показываем.
 */
export function getTraitFilterOptions(traits: Trait[]): TraitFilterOptions {
  const types = new Set<string>()
  const characteristics = new Set<string>()
  const skills = new Set<string>()

  for (const trait of traits) {
    if (trait.type && trait.type !== '—') types.add(trait.type)
    for (const characteristic of trait.characteristics) characteristics.add(characteristic)
    for (const skill of trait.skills) skills.add(skill)
  }

  return {
    types: [...types].sort((a, b) => a.localeCompare(b, 'ru')),
    characteristics: [...characteristics].sort((a, b) => a.localeCompare(b, 'ru')),
    skills: [...skills].sort((a, b) => a.localeCompare(b, 'ru')),
  }
}

/**
 * Фильтрует список: внутри одной группы — ИЛИ, между группами — И.
 * Поиск идёт по названию, описанию, характеристикам и навыкам.
 */
export function filterTraits(traits: Trait[], filters: TraitFilters): Trait[] {
  const query = normalizeSearchText(filters.search)

  return traits.filter((trait) => {
    if (filters.types.length > 0 && !filters.types.includes(trait.type)) return false
    if (
      filters.characteristics.length > 0 &&
      !filters.characteristics.some((c) => trait.characteristics.includes(c))
    ) {
      return false
    }
    if (filters.skills.length > 0 && !filters.skills.some((s) => trait.skills.includes(s))) {
      return false
    }

    if (query) {
      const haystack = normalizeSearchText(
        `${trait.name} ${trait.type} ${trait.description} ${trait.characteristics.join(' ')} ${trait.skills.join(' ')}`
      )
      if (!haystack.includes(query)) return false
    }

    return true
  })
}

export function sortTraitsByName(traits: Trait[]): Trait[] {
  const copy = [...traits]
  copy.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  return copy
}

export function activeTraitFiltersCount(filters: TraitFilters): number {
  return (
    (filters.search.trim() ? 1 : 0) +
    filters.types.length +
    filters.characteristics.length +
    filters.skills.length
  )
}
