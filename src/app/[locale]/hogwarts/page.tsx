import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getSpells } from '@/data/hogwarts'
import LanguageSelector from './components/LanguageSelector'
import styles from './page.module.scss'

export async function generateMetadata(props: any): Promise<Metadata> {
  const { params } = await props
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'HogwartsPage' })

  return {
    title: t('title'),
    description: t('subtitle'),
  }
}

export default async function HogwartsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('HogwartsPage')
  const spellsCount = getSpells(locale).length

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Link href="/" className={styles.backLink}>
          {t('back_home')}
        </Link>
        <LanguageSelector />
      </div>

      <div className={styles.header}>
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </div>

      <div className={styles.grid}>
        <Link href="/hogwarts/spells" className={`${styles.card} ${styles.active}`}>
          <h2>{t('spells')}</h2>
          <p className={styles.hint}>{t('spells_count', { count: spellsCount })}</p>
        </Link>

        <div className={styles.card} aria-disabled="true">
          <h2>{t('items')}</h2>
          <span className={styles.badge}>{t('coming_soon')}</span>
        </div>

        <div className={styles.card} aria-disabled="true">
          <h2>{t('wands')}</h2>
          <span className={styles.badge}>{t('coming_soon')}</span>
        </div>

        <div className={styles.card} aria-disabled="true">
          <h2>{t('general')}</h2>
          <span className={styles.badge}>{t('coming_soon')}</span>
        </div>
      </div>
    </div>
  )
}
