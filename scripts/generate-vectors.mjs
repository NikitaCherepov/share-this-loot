#!/usr/bin/env node
/**
 * Генерация векторов для умного поиска (заклинания, черты и другие разделы).
 *
 * Запуск:
 *   node scripts/generate-vectors.mjs                      — все разделы, все непустые локали
 *   node scripts/generate-vectors.mjs --section traits     — только черты
 *   node scripts/generate-vectors.mjs --locale ru          — только русский
 *   node scripts/generate-vectors.mjs --section spells --locale en
 *
 * Разделы ищутся автоматически: каждая папка в src/data/hogwarts
 * со словарями-JSON внутри — отдельный раздел (spells, traits, ...).
 * Векторы кладутся в <раздел>/vectors/<locale>.json.
 *
 * Настройки берутся из .vector-env (см. .vector-env.example):
 *   EMBEDDING_API_URL   — адрес OpenAI-совместимого embeddings-эндпоинта
 *   EMBEDDING_MODEL     — название модели
 *   EMBEDDING_API_KEY   — ключ (опционально, для локальных серверов не нужен)
 *
 * На каждую запись отправляется весь объект кроме id.
 * Уже векторизованные id пропускаются, прогресс сохраняется после каждой
 * записи — скрипт можно спокойно прерывать и перезапускать.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fetchWithProxy } from '../src/lib/proxy-fetch.mjs'

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'hogwarts')

/* ---------- env ---------- */

function loadVectorEnv() {
  const envPath = path.join(process.cwd(), '.vector-env')
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!match) continue
    let value = match[2]
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(match[1] in process.env)) process.env[match[1]] = value
  }
}

let config = {
  url: null,
  model: null,
  apiKey: '',
  proxyUrl: '',
}

/* ---------- данные ---------- */

// под какими ключами искать массив записей в JSON словаря для каждого раздела
const SECTION_KEYS = {
  spells: ['spells', 'data', 'заклинания'],
  traits: ['traits', 'data', 'черты'],
  items: ['items', 'data', 'предметы'],
  wands: ['wands', 'data', 'палочки'],
}
const DEFAULT_KEYS = ['data']

/** Достаёт записи из JSON: голый массив, {"traits": [...]}, {"data": ...} и т.п. */
function extractEntries(data, section) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    for (const key of SECTION_KEYS[section] ?? DEFAULT_KEYS) {
      if (Array.isArray(data[key])) return data[key]
    }
  }
  return []
}

/* ---------- embedding api ---------- */

async function embedText(text) {
  const res = await fetchWithProxy(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({ model: config.model, input: text }),
  }, config.proxyUrl)

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Embedding API ${res.status}: ${body.slice(0, 300)}`)
  }

  const json = await res.json()
  const vector =
    json?.data?.[0]?.embedding ??
    json?.embedding ??
    (Array.isArray(json?.[0]) ? json[0] : null)

  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error(`Неожиданный формат ответа embedding API: ${JSON.stringify(json).slice(0, 300)}`)
  }

  return vector
}

/* ---------- main ---------- */

loadVectorEnv()

// конфиг снимаем ПОСЛЕ загрузки .vector-env
config = {
  url: process.env.EMBEDDING_API_URL,
  model: process.env.EMBEDDING_MODEL,
  apiKey: process.env.EMBEDDING_API_KEY || '',
  proxyUrl: process.env.EMBEDDING_PROXY_URL || '',
}

if (!config.url || !config.model) {
  console.error('Нет EMBEDDING_API_URL или EMBEDDING_MODEL.')
  console.error('Создай .vector-env рядом с package.json (пример — .vector-env.example).')
  process.exit(1)
}

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index !== -1 ? process.argv[index + 1] : null
}

const localeArg = argValue('--locale')
const sectionArg = argValue('--section')

// разделы = подпапки с данными (кроме папок vectors)
const sectionDirs = fs
  .readdirSync(DATA_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== 'vectors')

let totalProcessed = 0

for (const sectionDir of sectionDirs) {
  const section = sectionDir.name
  if (sectionArg && section !== sectionArg) continue

  const dirPath = path.join(DATA_DIR, section)
  const vectorsDir = path.join(dirPath, 'vectors')

  const dictFiles = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)

  for (const file of dictFiles) {
    const locale = path.basename(file, '.json')
    if (localeArg && locale !== localeArg) continue

    const dict = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'))
    const entries = extractEntries(dict, section)

    if (entries.length === 0) {
      console.log(`[${section}/${locale}] словарь пуст — пропускаю`)
      continue
    }

    const vectorFile = path.join(vectorsDir, `${locale}.json`)
    fs.mkdirSync(vectorsDir, { recursive: true })
    const existing = fs.existsSync(vectorFile)
      ? JSON.parse(fs.readFileSync(vectorFile, 'utf8'))
      : []
    const doneIds = new Set(existing.map((entry) => entry.id))

    console.log(`[${section}/${locale}] записей: ${entries.length}, уже векторизовано: ${doneIds.size}`)

    let processed = 0
    let skipped = 0

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const id = typeof entry.id === 'string' && entry.id ? entry.id : `${section}_${i}`

      if (doneIds.has(id)) {
        skipped++
        continue
      }

      const { id: _omit, ...rest } = entry
      const text = JSON.stringify(rest)

      try {
        const vector = await embedText(text)
        existing.push({ id, vector })
        doneIds.add(id)
        processed++
        totalProcessed++

        // сохраняем после каждой записи, чтобы прогресс не терялся
        fs.writeFileSync(vectorFile, JSON.stringify(existing, null, 2))
        console.log(`  + ${entry.name ?? id} (${vector.length}d)`)
      } catch (error) {
        console.error(`  ! ошибка на "${entry.name ?? id}": ${error.message}`)
        console.error('  Прогресс сохранён, исправь проблему и перезапусти скрипт.')
        process.exit(1)
      }
    }

    console.log(`[${section}/${locale}] готово: +${processed}, пропущено (уже есть): ${skipped}`)
  }
}

console.log(totalProcessed > 0 ? 'Всего обработано новых: ' + totalProcessed : 'Новых записей нет.')
