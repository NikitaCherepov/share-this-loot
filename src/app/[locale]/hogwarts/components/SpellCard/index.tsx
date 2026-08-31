'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import type { Spell } from '@/data/hogwarts'
import styles from './SpellCard.module.scss'

interface SpellCardProps {
  spell: Spell
}

const INLINE_TAG_RE = /<(strong|b|em|i)>([\s\S]*?)<\/\1>/gi

/**
 * Превращает <strong>/<b> и <i>/<em> в жирный/курсив.
 * Всё остальное остаётся обычным текстом (экранируется React'ом).
 */
function renderInline(text: string, keyPrefix = ''): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const pattern = new RegExp(INLINE_TAG_RE.source, 'gi')
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    const tag = match[1].toLowerCase()
    const inner = renderInline(match[2], `${keyPrefix}${key}-`)
    if (tag === 'strong' || tag === 'b') {
      nodes.push(<strong key={`${keyPrefix}s${key}`}>{inner}</strong>)
    } else {
      nodes.push(<em key={`${keyPrefix}e${key}`}>{inner}</em>)
    }
    key++
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export default function SpellCard({ spell }: SpellCardProps) {
  const t = useTranslations('SpellsPage')
  const [open, setOpen] = useState(false)

  const levelLabel = spell.level === 0 ? t('cantrip') : t('level_value', { n: spell.level })

  return (
    <div className={`${styles.container} ${open ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className={styles.titleRow}>
          <span className={styles.name}>{spell.name}</span>
          {spell.ritual && (
            <span className={`${styles.marker} ${styles.ritualMarker}`}>{t('ritual')}</span>
          )}
        </div>

        <div className={styles.metaRow}>
          <span className={styles.typeBadge}>{spell.type}</span>
          <span className={styles.levelBadge}>{levelLabel}</span>
        </div>

        <span className={styles.chevron} aria-hidden="true" />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            className={styles.expandable}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className={styles.body}>
              <dl className={styles.stats}>
                <div className={styles.stat}>
                  <dt>{t('casting_time')}</dt>
                  <dd>{spell.castingTime}</dd>
                </div>
                <div className={styles.stat}>
                  <dt>{t('range')}</dt>
                  <dd>{spell.range}</dd>
                </div>
                <div className={styles.stat}>
                  <dt>{t('duration')}</dt>
                  <dd>{spell.duration}</dd>
                </div>
                <div className={styles.stat}>
                  <dt>{t('ritual')}</dt>
                  <dd>{spell.ritual ? t('yes') : t('no')}</dd>
                </div>
              </dl>

              {spell.keywords.length > 0 && (
                <div className={styles.keywords}>
                  {spell.keywords.map((keyword) => (
                    <span key={keyword} className={styles.keyword}>
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.description}>
                {spell.description
                  .split(/\r?\n/)
                  .filter((paragraph) => paragraph.trim().length > 0)
                  .map((paragraph, i) => (
                    <p key={i}>{renderInline(paragraph)}</p>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
