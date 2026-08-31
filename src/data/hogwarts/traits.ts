import ru from './traits/ru.json';
import en from './traits/en.json';

export interface Trait {
  id: string;
  name: string;
  /** Врождённая / Стандартная */
  type: string;
  /** На какие характеристики влияет (Сила, Ловкость, ...) */
  characteristics: string[];
  /** На какие навыки влияет (Запугивание, ...) */
  skills: string[];
  description: string;
}

type RawTrait = Partial<Trait>;

const dataByLocale: Record<string, RawTrait[]> = {
  ru: (ru as { traits?: RawTrait[] }).traits ?? [],
  en: (en as { traits?: RawTrait[] }).traits ?? [],
};

/** Локали, для которых есть непустой файл с чертами */
export const availableTraitLocales: string[] = Object.entries(dataByLocale)
  .filter(([, traits]) => traits.length > 0)
  .map(([locale]) => locale);

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function normalizeTrait(raw: RawTrait, index: number): Trait {
  return {
    id: raw.id && typeof raw.id === 'string' ? raw.id : `trait_${index}`,
    name: raw.name ?? '—',
    type: raw.type ?? '—',
    characteristics: normalizeStringArray(raw.characteristics),
    skills: normalizeStringArray(raw.skills),
    description: raw.description ?? '',
  };
}

/**
 * Возвращает черты для локали.
 * Если файла/данных для локали нет — откатывается на русский.
 */
export function getTraits(locale: string): Trait[] {
  const raw = dataByLocale[locale]?.length ? dataByLocale[locale] : dataByLocale.ru;
  return (raw ?? []).map(normalizeTrait);
}
