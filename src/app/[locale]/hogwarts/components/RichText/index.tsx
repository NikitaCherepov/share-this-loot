import styles from './RichText.module.scss'

/**
 * Общий рендер описаний справочника (заклинания, черты и т.д.).
 *
 * Поддерживает:
 *   - абзацы через \n (каждый — отдельный <p>)
 *   - <strong>/<b> и <i>/<em> — жирный и курсив
 *   - <ul>/<ol> с <li> — маркированные и нумерованные списки
 *
 * Всё остальное остаётся обычным текстом (экранируется React'ом).
 */

export type RichTextBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }

const LIST_RE = /<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi
const LI_RE = /<li\b[^>]*>([\s\S]*?)<\/li>/gi

/**
 * Разбивает текст на блоки: абзацы и списки.
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

  const pattern = new RegExp(LIST_RE.source, 'gi')
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    pushParagraphs(text.slice(lastIndex, match.index))

    const items: string[] = []
    const li = new RegExp(LI_RE.source, 'gi')
    let liMatch: RegExpExecArray | null
    while ((liMatch = li.exec(match[2])) !== null) {
      const item = liMatch[1].trim()
      if (item) items.push(item)
    }

    if (items.length > 0) {
      blocks.push({ type: 'list', ordered: match[1].toLowerCase() === 'ol', items })
    }

    lastIndex = pattern.lastIndex
  }

  pushParagraphs(text.slice(lastIndex))

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

export default function RichText({ text }: { text: string }) {
  const blocks = parseRichText(text)

  return (
    <div className={styles.description}>
      {blocks.map((block, i) => {
        if (block.type === 'paragraph') {
          return <p key={i}>{renderInline(block.text, `${i}-`)}</p>
        }

        const ListTag = block.ordered ? 'ol' : 'ul'
        return (
          <ListTag
            key={i}
            className={`${styles.list} ${block.ordered ? styles.listOrdered : ''}`}
          >
            {block.items.map((item, j) => (
              <li key={j}>{renderInline(item, `${i}-${j}-`)}</li>
            ))}
          </ListTag>
        )
      })}
    </div>
  )
}
