'use client'

import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { availableSpellLocales } from '@/data/hogwarts'
import styles from './LanguageSelector.module.scss'

/**
 * Селектор языка данных справочника.
 * Показывает только те локали, для которых есть непустой JSON с данными.
 */
export default function LanguageSelector() {
  const locale = useLocale()
  const pathname = usePathname()

  if (availableSpellLocales.length <= 1) return null

  return (
    <div className={styles.container} aria-label="Language">
      {availableSpellLocales.map((loc) => (
        <Link
          key={loc}
          href={pathname}
          locale={loc}
          className={`${styles.pill} ${loc === locale ? styles.active : ''}`}
        >
          {loc.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}
