'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Spell } from '@/data/hogwarts'
import LanguageSelector from '../components/LanguageSelector'
import SpellCard from '../components/SpellCard'
import {
  activeFiltersCount,
  emptyFilters,
  filterSpells,
  getFilterOptions,
  sortSpells,
  type SortMode,
  type SpellFilters,
} from './spells-utils'
import styles from './spells.module.scss'

const KEYWORDS_COLLAPSED = 10
/** максимум символов в умном поиске — столько же проверяет api */
const SMART_QUERY_MAX = 200

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

type UiSortMode = SortMode | 'score'

interface SpellsBrowserProps {
  spells: Spell[]
}

export default function SpellsBrowser({ spells }: SpellsBrowserProps) {
  const t = useTranslations('SpellsPage')
  const th = useTranslations('HogwartsPage')
  const locale = useLocale()

  const [filters, setFilters] = useState<SpellFilters>(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [showAllKeywords, setShowAllKeywords] = useState(false)
  const [sort, setSort] = useState<UiSortMode>('level')

  // умный поиск
  const [smartQuery, setSmartQuery] = useState('')
  // null = поиск не запускали (показываем всё), массив — результаты поиска
  // (пустой массив = искали и не нашли, а не «выключить поиск»)
  const [semantic, setSemantic] = useState<SemanticMatch[] | null>(null)
  const [smartStatus, setSmartStatus] = useState<
    '' | 'loading' | 'error' | 'unavailable' | 'cooldown'
  >('')

  const options = useMemo(() => getFilterOptions(spells), [spells])

  const visible = useMemo(() => {
    let list = filterSpells(spells, filters)

    if (semantic !== null) {
      const order = new Map(semantic.map((match, index) => [match.id, index]))
      list = list.filter((spell) => order.has(spell.id))
      if (sort === 'score') {
        list = [...list].sort((a, b) => order.get(a.id)! - order.get(b.id)!)
      } else {
        list = sortSpells(list, sort as SortMode)
      }
    } else {
      list = sortSpells(list, sort as SortMode)
    }

    return list
  }, [spells, filters, sort, semantic])

  const activeCount = activeFiltersCount(filters) + (semantic !== null ? 1 : 0)

  const clearSmart = () => {
    setSemantic(null)
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
        body: JSON.stringify({ query, locale }),
      })
      if (res.status === 429) {
        setSemantic(null)
        setSmartStatus('cooldown')
        return
      }

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'smart search failed')
      if (!data.indexed) {
        setSemantic(null)
        setSmartStatus('unavailable')
        return
      }

      setSemantic(data.results ?? [])
      setSort('score')
      setSmartStatus('')
    } catch {
      setSemantic(null)
      setSmartStatus('error')
    }
  }

  const handleSortClick = (mode: UiSortMode) => {
    if (mode !== 'score' && semantic !== null) clearSmart()
    setSort(mode)
  }

  const resetAll = () => {
    setFilters(emptyFilters)
    setShowAllKeywords(false)
    clearSmart()
  }

  const patch = (next: Partial<SpellFilters>) => setFilters((prev) => ({ ...prev, ...next }))

  const levelLabel = (level: number) =>
    level === 0 ? t('cantrip') : t('level_value', { n: level })

  const shownKeywords = showAllKeywords
    ? options.keywords
    : options.keywords.slice(0, KEYWORDS_COLLAPSED)

  if (spells.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.top}>
          <Link href="/hogwarts" className={styles.backLink}>
            {t('back_to_hogwarts')}
          </Link>
          <LanguageSelector />
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
        <LanguageSelector />
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
          maxLength={SMART_QUERY_MAX}
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
        {semantic !== null && (
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
      {smartStatus === 'cooldown' && (
        <p className={styles.smartStatus}>{t('smart_search_cooldown')}</p>
      )}
      {smartStatus === 'unavailable' && (
        <p className={styles.smartStatus}>{t('smart_search_unavailable')}</p>
      )}
      {smartStatus === '' && semantic !== null && semantic.length > 0 && (
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
            className={`${styles.sortButton} ${sort === 'level' ? styles.sortButtonActive : ''}`}
            onClick={() => handleSortClick('level')}
          >
            {t('by_level')}
          </button>
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
            disabled={semantic === null || semantic.length === 0}
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

          {options.levels.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('level')}</h3>
              <div className={styles.chips}>
                {options.levels.map((level) => (
                  <Chip
                    key={level}
                    label={levelLabel(level)}
                    active={filters.levels.includes(level)}
                    onClick={() => patch({ levels: toggleValue(filters.levels, level) })}
                  />
                ))}
              </div>
            </section>
          )}

          {options.keywords.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('keywords')}</h3>
              <div className={styles.chips}>
                {shownKeywords.map((keyword) => (
                  <Chip
                    key={keyword}
                    label={keyword}
                    active={filters.keywords.includes(keyword)}
                    onClick={() => patch({ keywords: toggleValue(filters.keywords, keyword) })}
                  />
                ))}
                {options.keywords.length > KEYWORDS_COLLAPSED && (
                  <button
                    type="button"
                    className={styles.showMoreButton}
                    onClick={() => setShowAllKeywords((v) => !v)}
                  >
                    {showAllKeywords
                      ? '−'
                      : `+${options.keywords.length - KEYWORDS_COLLAPSED}`}
                  </button>
                )}
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('ritual')}</h3>
            <div className={styles.chips}>
              <Chip
                label={t('ritual_only')}
                active={filters.ritualOnly}
                onClick={() => patch({ ritualOnly: !filters.ritualOnly })}
              />
            </div>
          </section>
        </div>
      )}

      <p className={styles.resultsCount}>{t('results_found', { count: visible.length })}</p>

      <div className={styles.list}>
        {visible.map((spell) => (
          <SpellCard key={spell.id} spell={spell} />
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
