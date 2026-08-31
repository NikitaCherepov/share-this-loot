import styles from './RichText.module.scss'

/**
 * Общий рендер описаний справочника (заклинания, черты и т.д.).
 *
 * Поддерживает:
 *   - абзацы через \n (каждый — отдельный <p>)
 *   - <strong>/<b> и <i>/<em> — жирный и курсив
 *   - <ul>/<ol> с <li> — маркированные и нумерованные списки,
 *     включая вложенные списки любой глубины
 *
 * Всё остальное остаётся обычным текстом (экранируется React'ом).
 */

export interface RichTextListItem {
  /** инлайн-текст пункта (без вложенных списков) */
  text: string
  /** вложенные списки внутри пункта */
  lists: RichTextListBlock[]
}

export interface RichTextListBlock {
  type: 'list'
  ordered: boolean
  items: RichTextListItem[]
}

export type RichTextBlock = { type: 'paragraph'; text: string } | RichTextListBlock

/* ---------- сканер html-подобной разметки ---------- */

const TAG_RE = /<(\/?)\s*(ul|ol|li)\b[^>]*>/gi

interface Tag {
  close: boolean
  name: 'ul' | 'ol' | 'li'
  start: number
  end: number
}

function scanTags(html: string): Tag[] {
  const tags: Tag[] = []
  const pattern = new RegExp(TAG_RE.source, 'gi')
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html)) !== null) {
    tags.push({
      close: match[1] === '/',
      name: match[2].toLowerCase() as Tag['name'],
      start: match.index,
      end: pattern.lastIndex,
    })
  }

  return tags
}

/**
 * Ищет парный закрывающий тег для tags[i] — с учётом вложенности.
 * Вложенные списки всегда обёрнуты в <li>, поэтому достаточно
 * считать глубину одноимённых тегов.
 */
function findClose(tags: Tag[], i: number): Tag | null {
  let depth = 1

  for (let j = i + 1; j < tags.length; j++) {
    if (tags[j].name !== tags[i].name) continue
    depth += tags[j].close ? -1 : 1
    if (depth === 0) return tags[j]
  }

  return null
}

/** Разбирает содержимое списка: пункты <li>, каждый со вложенными списками. */
function parseItems(inner: string): RichTextListItem[] {
  const items: RichTextListItem[] = []
  const tags = scanTags(inner)

  let i = 0
  while (i < tags.length) {
    const tag = tags[i]
    if (tag.close || tag.name !== 'li') {
      i++
      continue
    }

    const close = findClose(tags, i)
    const chunk = close ? inner.slice(tag.end, close.start) : inner.slice(tag.end)
    const item = parseItemContent(chunk)

    if (item.text || item.lists.length > 0) items.push(item)
    if (!close) break // незакрытый <li> — забрали остаток

    i = tags.indexOf(close) + 1
  }

  return items
}

/** Разбирает содержимое пункта: инлайн-текст и вложенные списки. */
function parseItemContent(content: string): RichTextListItem {
  const tags = scanTags(content)
  const textParts: string[] = []
  const lists: RichTextListBlock[] = []
  let cursor = 0

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    if (tag.close || tag.name === 'li') continue
    const close = findClose(tags, i)
    if (!close) continue

    textParts.push(content.slice(cursor, tag.start))
    lists.push(parseList(tag, content.slice(tag.end, close.start)))
    cursor = close.end
    i = tags.indexOf(close)
  }

  textParts.push(content.slice(cursor))

  return {
    text: textParts.join(' ').replace(/\s+/g, ' ').trim(),
    lists,
  }
}

function parseList(openTag: Tag, inner: string): RichTextListBlock {
  return {
    type: 'list',
    ordered: openTag.name === 'ol',
    items: parseItems(inner),
  }
}

/**
 * Разбивает текст на блоки: абзацы и списки (в том числе вложенные).
 * Чистая функция — её же проверяем тестами.
 */
export function parseRichText(text: string): RichTextBlock[] {
  const blocks: RichTextBlock[] = []

  const pushParagraphs = (chunk: string) => {
    for (const paragraph of chunk.split(/\r?\n/)) {
      if (paragraph.trim().length > 0) {
        blocks.push({ type: 'paragraph', text: paragraph })
      }
    }
  }

  if (!text) return blocks

  const tags = scanTags(text)
  let cursor = 0

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    if (tag.close || tag.name === 'li') continue
    if (tag.start < cursor) continue // внутри уже разобранного списка

    const close = findClose(tags, i)
    if (!close) continue // незакрытый — оставляем как обычный текст

    pushParagraphs(text.slice(cursor, tag.start))

    const list = parseList(tag, text.slice(tag.end, close.start))
    if (list.items.length > 0) blocks.push(list)

    cursor = close.end
    i = tags.indexOf(close)
  }

  pushParagraphs(text.slice(cursor))

  return blocks
}

const INLINE_TAG_RE = /<(strong|b|em|i)>([\s\S]*?)<\/\1>/gi

/**
 * Превращает <strong>/<b> и <i>/<em> в жирный/курсив.
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

function renderListBlock(block: RichTextListBlock, keyPrefix: string): React.ReactElement {
  const ListTag = block.ordered ? 'ol' : 'ul'

  return (
    <ListTag key={keyPrefix} className={`${styles.list} ${block.ordered ? styles.listOrdered : ''}`}>
      {block.items.map((item, i) => (
        <li key={i}>
          {item.text && renderInline(item.text, `${keyPrefix}-${i}-`)}
          {item.lists.map((nested, j) => renderListBlock(nested, `${keyPrefix}-${i}-${j}`))}
        </li>
      ))}
    </ListTag>
  )
}

export default function RichText({ text }: { text: string }) {
  const blocks = parseRichText(text)

  return (
    <div className={styles.description}>
      {blocks.map((block, i) =>
        block.type === 'paragraph' ? (
          <p key={i}>{renderInline(block.text, `${i}-`)}</p>
        ) : (
          renderListBlock(block, `${i}`)
        )
      )}
    </div>
  )
}
