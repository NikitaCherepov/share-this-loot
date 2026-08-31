'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { availableTraitLocales, type Trait } from '@/data/hogwarts/traits'
import LanguageSelector from '../components/LanguageSelector'
import TraitCard from '../components/TraitCard'
import {
  activeTraitFiltersCount,
  emptyTraitFilters,
  filterTraits,
  getTraitFilterOptions,
  sortTraitsByName,
  type TraitFilters,
} from './traits-utils'
// общий шаблон страницы — те же стили, что у заклинаний
import styles from '../spells/spells.module.scss'

const SKILLS_COLLAPSED = 10

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

interface SemanticMatch {
  id: string
  score: number
}

type UiSortMode = 'name' | 'score'

interface TraitsBrowserProps {
  traits: Trait[]
}

export default function TraitsBrowser({ traits }: TraitsBrowserProps) {
  const t = useTranslations('TraitsPage')
  const locale = useLocale()

  const [filters, setFilters] = useState<TraitFilters>(emptyTraitFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [showAllSkills, setShowAllSkills] = useState(false)
  const [sort, setSort] = useState<UiSortMode>('name')

  // умный поиск
  const [smartQuery, setSmartQuery] = useState('')
  const [semantic, setSemantic] = useState<SemanticMatch[]>([])
  const [smartStatus, setSmartStatus] = useState<'' | 'loading' | 'error' | 'unavailable'>('')

  const options = useMemo(() => getTraitFilterOptions(traits), [traits])

  const visible = useMemo(() => {
    let list = filterTraits(traits, filters)

    if (semantic.length > 0) {
      const order = new Map(semantic.map((match, index) => [match.id, index]))
      list = list.filter((trait) => order.has(trait.id))
      if (sort === 'score') {
        list = [...list].sort((a, b) => order.get(a.id)! - order.get(b.id)!)
      } else {
        list = sortTraitsByName(list)
      }
    } else {
      list = sortTraitsByName(list)
    }

    return list
  }, [traits, filters, sort, semantic])

  const activeCount = activeTraitFiltersCount(filters) + (semantic.length > 0 ? 1 : 0)

  const clearSmart = () => {
    setSemantic([])
    setSmartQuery('')
    setSmartStatus('')
  }

  const runSmartSearch = async () => {
    const query = smartQuery.trim()
    if (!query || smartStatus === 'loading') return

    setSmartStatus('loading')
    try {
      const res = await fetch('/api/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, locale, section: 'traits' }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'smart search failed')
      if (!data.indexed) {
        setSemantic([])
        setSmartStatus('unavailable')
        return
      }

      setSemantic(data.results ?? [])
      setSort('score')
      setSmartStatus('')
    } catch {
      setSemantic([])
      setSmartStatus('error')
    }
  }

  const handleSortClick = (mode: UiSortMode) => {
    if (mode !== 'score' && semantic.length > 0) clearSmart()
    setSort(mode)
  }

  const resetAll = () => {
    setFilters(emptyTraitFilters)
    setShowAllSkills(false)
    clearSmart()
  }

  const patch = (next: Partial<TraitFilters>) => setFilters((prev) => ({ ...prev, ...next }))

  const shownSkills = showAllSkills ? options.skills : options.skills.slice(0, SKILLS_COLLAPSED)

  if (traits.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.top}>
          <Link href="/hogwarts" className={styles.backLink}>
            {t('back_to_hogwarts')}
          </Link>
          <LanguageSelector locales={availableTraitLocales} />
        </div>
        <h1 className={styles.title}>{t('title')}</h1>
        <div className={styles.empty}>
          <p>{t('no_data')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Link href="/hogwarts" className={styles.backLink}>
          {t('back_to_hogwarts')}
        </Link>
        <LanguageSelector locales={availableTraitLocales} />
      </div>

      <h1 className={styles.title}>{t('title')}</h1>

      <input
        className={styles.search}
        type="search"
        placeholder={t('search_placeholder')}
        value={filters.search}
        onChange={(e) => patch({ search: e.target.value })}
      />

      <div className={styles.smartBlock}>
        <input
          className={styles.smartInput}
          type="search"
          placeholder={t('smart_search_placeholder')}
          value={smartQuery}
          onChange={(e) => setSmartQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') runSmartSearch()
          }}
          disabled={smartStatus === 'loading'}
        />
        <button
          type="button"
          className={styles.smartButton}
          onClick={runSmartSearch}
          disabled={smartStatus === 'loading' || smartQuery.trim().length === 0}
        >
          {smartStatus === 'loading' ? t('smart_search_searching') : t('smart_search_button')}
        </button>
        {semantic.length > 0 && (
          <button
            type="button"
            className={styles.smartClear}
            onClick={clearSmart}
            title={t('reset')}
            aria-label={t('reset')}
          >
            ×
          </button>
        )}
      </div>

      {smartStatus === 'loading' && <p className={styles.smartStatus}>{t('smart_search_searching')}</p>}
      {smartStatus === 'error' && <p className={styles.smartStatus}>{t('smart_search_error')}</p>}
      {smartStatus === 'unavailable' && (
        <p className={styles.smartStatus}>{t('smart_search_unavailable')}</p>
      )}
      {smartStatus === '' && semantic.length > 0 && (
        <p className={styles.smartStatus}>{t('smart_search_results', { count: semantic.length })}</p>
      )}

      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolbarButton} ${showFilters ? styles.toolbarButtonActive : ''}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          {showFilters ? t('hide_filters') : t('filters')}
          {activeCount > 0 && <span className={styles.countBadge}>{activeCount}</span>}
        </button>

        {activeCount > 0 && (
          <button type="button" className={styles.toolbarButton} onClick={resetAll}>
            {t('reset')}
          </button>
        )}

        <div className={styles.sortBlock} role="group" aria-label={t('sort')}>
          <button
            type="button"
            className={`${styles.sortButton} ${sort === 'name' ? styles.sortButtonActive : ''}`}
            onClick={() => handleSortClick('name')}
          >
            {t('by_name')}
          </button>
          <button
            type="button"
            className={`${styles.sortButton} ${sort === 'score' ? styles.sortButtonActive : ''}`}
            onClick={() => handleSortClick('score')}
            disabled={semantic.length === 0}
          >
            {t('by_score')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.panel}>
          {options.types.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('type')}</h3>
              <div className={styles.chips}>
                {options.types.map((type) => (
                  <Chip
                    key={type}
                    label={type}
                    active={filters.types.includes(type)}
                    onClick={() => patch({ types: toggleValue(filters.types, type) })}
                  />
                ))}
              </div>
            </section>
          )}

          {options.characteristics.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('characteristics')}</h3>
              <div className={styles.chips}>
                {options.characteristics.map((characteristic) => (
                  <Chip
                    key={characteristic}
                    label={characteristic}
                    active={filters.characteristics.includes(characteristic)}
                    onClick={() =>
                      patch({
                        characteristics: toggleValue(filters.characteristics, characteristic),
                      })
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {options.skills.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('skills')}</h3>
              <div className={styles.chips}>
                {shownSkills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    active={filters.skills.includes(skill)}
                    onClick={() => patch({ skills: toggleValue(filters.skills, skill) })}
                  />
                ))}
                {options.skills.length > SKILLS_COLLAPSED && (
                  <button
                    type="button"
                    className={styles.showMoreButton}
                    onClick={() => setShowAllSkills((v) => !v)}
                  >
                    {showAllSkills ? '−' : `+${options.skills.length - SKILLS_COLLAPSED}`}
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      <p className={styles.resultsCount}>{t('results_found', { count: visible.length })}</p>

      <div className={styles.list}>
        {visible.map((trait) => (
          <TraitCard key={trait.id} trait={trait} />
        ))}
      </div>

      {visible.length === 0 && (
        <div className={styles.empty}>
          <p>{t('nothing_found')}</p>
          <p className={styles.emptyHint}>{t('nothing_found_hint')}</p>
          <button type="button" className={styles.toolbarButton} onClick={resetAll}>
            {t('reset')}
          </button>
        </div>
      )}
    </div>
  )
}
