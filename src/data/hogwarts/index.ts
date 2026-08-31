import ru from './spells/ru.json';
import en from './spells/en.json';

export interface Spell {
  id: string;
  name: string;
  type: string;
  /** 0 = заговор (cantrip), 1+ = уровень заклинания */
  level: number;
  castingTime: string;
  range: string;
  duration: string;
  ritual: boolean;
  keywords: string[];
  description: string;
}

type RawSpell = Partial<Spell>;

const dataByLocale: Record<string, RawSpell[]> = {
  ru: (ru as { spells: RawSpell[] }).spells ?? [],
  en: (en as { spells: RawSpell[] }).spells ?? [],
};

/** Локали, для которых есть непустой файл с заклинаниями */
export const availableSpellLocales: string[] = Object.entries(dataByLocale)
  .filter(([, spells]) => spells.length > 0)
  .map(([locale]) => locale);

const CANTRIP_ALIASES = ['0', 'заговор', 'заговоры', 'заговора', 'cantrip', 'cantrips', 'трюк'];

function normalizeLevel(level: unknown): number {
  if (typeof level === 'number' && Number.isFinite(level)) {
    return Math.max(0, Math.trunc(level));
  }
  if (typeof level === 'string') {
    const value = level.trim().toLowerCase();
    if (CANTRIP_ALIASES.includes(value)) return 0;
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
  }
  return 0;
}

function normalizeSpell(raw: RawSpell, index: number): Spell {
  return {
    id: raw.id && typeof raw.id === 'string' ? raw.id : `spell_${index}`,
    name: raw.name ?? '—',
    type: raw.type ?? '—',
    level: normalizeLevel(raw.level),
    castingTime: raw.castingTime ?? '—',
    range: raw.range ?? '—',
    duration: raw.duration ?? '—',
    ritual: raw.ritual === true,
    keywords: Array.isArray(raw.keywords)
      ? raw.keywords.filter((k): k is string => typeof k === 'string')
      : [],
    description: raw.description ?? '',
  };
}

/**
 * Возвращает заклинания для локали.
 * Если файла/данных для локали нет — откатывается на русский.
 */
export function getSpells(locale: string): Spell[] {
  const raw = dataByLocale[locale]?.length ? dataByLocale[locale] : dataByLocale.ru;
  return (raw ?? []).map(normalizeSpell);
}
