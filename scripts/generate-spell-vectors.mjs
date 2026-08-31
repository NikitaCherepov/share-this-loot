#!/usr/bin/env node
/**
 * Генерация векторов заклинаний для умного поиска.
 *
 * Запуск:
 *   node scripts/generate-spell-vectors.mjs            — все непустые локали
 *   node scripts/generate-spell-vectors.mjs --locale ru — только ru
 *
 * Настройки берутся из .vector-env (см. .vector-env.example):
 *   EMBEDDING_API_URL   — адрес OpenAI-совместимого embeddings-эндпоинта
 *   EMBEDDING_MODEL     — название модели
 *   EMBEDDING_API_KEY   — ключ (опционально, для локальных серверов не нужен)
 *
 * На каждое заклинание отправляется весь объект кроме id.
 * Уже векторизованные id пропускаются, прогресс сохраняется после каждого
 * заклинания — скрипт можно спокойно прерывать и перезапускать.
 */

import fs from 'node:fs'
import path from 'node:path'

const SPELLS_DIR = path.join(process.cwd(), 'src', 'data', 'hogwarts', 'spells')
const VECTORS_DIR = path.join(SPELLS_DIR, 'vectors')

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
}

/* ---------- данные ---------- */

/** Достаёт заклинания из JSON: голый массив, {"spells": [...]}, {"data": ...}, {"заклинания": ...} */
function extractSpells(data) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    for (const key of ['spells', 'data', 'заклинания']) {
      if (Array.isArray(data[key])) return data[key]
    }
  }
  return []
}

/* ---------- embedding api ---------- */

async function embedText(text) {
  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({ model: config.model, input: text }),
  })

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
}

if (!config.url || !config.model) {
  console.error('Нет EMBEDDING_API_URL или EMBEDDING_MODEL.')
  console.error('Создай .vector-env рядом с package.json (пример — .vector-env.example).')
  process.exit(1)
}

const localeArgIndex = process.argv.indexOf('--locale')
const localeArg = localeArgIndex !== -1 ? process.argv[localeArgIndex + 1] : null

const dictFiles = fs
  .readdirSync(SPELLS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => entry.name)

let totalProcessed = 0

for (const file of dictFiles) {
  const locale = path.basename(file, '.json')
  if (localeArg && locale !== localeArg) continue

  const dict = JSON.parse(fs.readFileSync(path.join(SPELLS_DIR, file), 'utf8'))
  const spells = extractSpells(dict)

  if (spells.length === 0) {
    console.log(`[${locale}] словарь пуст — пропускаю`)
    continue
  }

  const vectorFile = path.join(VECTORS_DIR, `${locale}.json`)
  fs.mkdirSync(VECTORS_DIR, { recursive: true })
  const existing = fs.existsSync(vectorFile)
    ? JSON.parse(fs.readFileSync(vectorFile, 'utf8'))
    : []
  const doneIds = new Set(existing.map((entry) => entry.id))

  console.log(
    `[${locale}] заклинаний: ${spells.length}, уже векторизовано: ${doneIds.size}`
  )

  let processed = 0
  let skipped = 0

  for (let i = 0; i < spells.length; i++) {
    const spell = spells[i]
    const id = typeof spell.id === 'string' && spell.id ? spell.id : `spell_${i}`

    if (doneIds.has(id)) {
      skipped++
      continue
    }

    const { id: _omit, ...rest } = spell
    const text = JSON.stringify(rest)

    try {
      const vector = await embedText(text)
      existing.push({ id, vector })
      doneIds.add(id)
      processed++
      totalProcessed++

      // сохраняем после каждого заклинания, чтобы прогресс не терялся
      fs.writeFileSync(vectorFile, JSON.stringify(existing, null, 2))
      console.log(`  + ${spell.name ?? id} (${vector.length}d)`)
    } catch (error) {
      console.error(`  ! ошибка на "${spell.name ?? id}": ${error.message}`)
      console.error('  Прогресс сохранён, исправь проблему и перезапусти скрипт.')
      process.exit(1)
    }
  }

  console.log(`[${locale}] готово: +${processed}, пропущено (уже есть): ${skipped}`)
}

console.log(totalProcessed > 0 ? 'Всего обработано новых: ' + totalProcessed : 'Новых заклинаний нет.')
