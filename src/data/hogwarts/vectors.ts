import ru from './spells/vectors/ru.json';
import en from './spells/vectors/en.json';

export interface SpellVector {
  id: string;
  vector: number[];
}

function normalizeVectors(raw: unknown): SpellVector[] {
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

const vectorsByLocale: Record<string, SpellVector[]> = {
  ru: normalizeVectors(ru),
  en: normalizeVectors(en),
};

/**
 * Возвращает векторы заклинаний для локали.
 * Если данных нет — откатывается на русские.
 */
export function getSpellVectors(locale: string): SpellVector[] {
  return vectorsByLocale[locale]?.length ? vectorsByLocale[locale] : vectorsByLocale.ru;
}
