import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getTraits } from '@/data/hogwarts/traits'
import TraitsBrowser from './traits-browser'

export async function generateMetadata(props: any): Promise<Metadata> {
  const { params } = await props
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'TraitsPage' })

  return {
    title: t('title'),
  }
}

export default async function TraitsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const traits = getTraits(locale)

  return <TraitsBrowser traits={traits} />
}
