'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import type { Trait } from '@/data/hogwarts/traits'
import RichText from '../RichText'
// общий шаблон карточки — те же стили, что у заклинаний
import styles from '../SpellCard/SpellCard.module.scss'

interface TraitCardProps {
  trait: Trait
}

export default function TraitCard({ trait }: TraitCardProps) {
  const t = useTranslations('TraitsPage')
  const [open, setOpen] = useState(false)

  return (
    <div className={`${styles.container} ${open ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className={styles.titleRow}>
          <span className={styles.name}>{trait.name}</span>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.typeBadge}>{trait.type}</span>
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
              {(trait.characteristics.length > 0 || trait.skills.length > 0) && (
                <dl className={styles.stats}>
                  {trait.characteristics.length > 0 && (
                    <div className={styles.stat}>
                      <dt>{t('characteristics')}</dt>
                      <dd>{trait.characteristics.join(', ')}</dd>
                    </div>
                  )}
                  {trait.skills.length > 0 && (
                    <div className={styles.stat}>
                      <dt>{t('skills')}</dt>
                      <dd>{trait.skills.join(', ')}</dd>
                    </div>
                  )}
                </dl>
              )}

              <RichText text={trait.description} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
