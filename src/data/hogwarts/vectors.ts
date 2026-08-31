import spellsRu from './spells/vectors/ru.json';
import spellsEn from './spells/vectors/en.json';
import traitsRu from './traits/vectors/ru.json';
import traitsEn from './traits/vectors/en.json';

export interface VectorEntry {
  id: string;
  vector: number[];
}

function normalizeVectors(raw: unknown): VectorEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry): entry is { id: string; vector: unknown } =>
        !!entry && typeof entry === 'object' && typeof (entry as any).id === 'string'
    )
    .map((entry) => ({
      id: entry.id,
      vector: Array.isArray(entry.vector) ? entry.vector.map(Number) : [],
    }))
    .filter((entry) => entry.vector.length > 0);
}

const sections: Record<string, Record<string, VectorEntry[]>> = {
  spells: {
    ru: normalizeVectors(spellsRu),
    en: normalizeVectors(spellsEn),
  },
  traits: {
    ru: normalizeVectors(traitsRu),
    en: normalizeVectors(traitsEn),
  },
};

/**
 * Возвращает векторы раздела ('spells' | 'traits') для локали.
 * Если данных нет — откатывается на русские.
 */
export function getVectors(section: string, locale: string): VectorEntry[] {
  const byLocale = sections[section] ?? sections.spells;
  return byLocale[locale]?.length ? byLocale[locale] : byLocale.ru;
}
