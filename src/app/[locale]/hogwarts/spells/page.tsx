import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getSpells } from '@/data/hogwarts'
import SpellsBrowser from './spells-browser'

export async function generateMetadata(props: any): Promise<Metadata> {
  const { params } = await props
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SpellsPage' })

  return {
    title: t('title'),
  }
}

export default async function SpellsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const spells = getSpells(locale)

  return <SpellsBrowser spells={spells} />
}
