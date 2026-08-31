import { parseRichText } from './index'

describe('parseRichText', () => {
  it('режет текст на абзацы по переводам строки', () => {
    const blocks = parseRichText('Первый абзац\nВторой абзац\r\nТретий')

    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Первый абзац' },
      { type: 'paragraph', text: 'Второй абзац' },
      { type: 'paragraph', text: 'Третий' },
    ])
  })

  it('выкидывает пустые абзацы', () => {
    const blocks = parseRichText('Текст\n\n\nЕщё текст\n')

    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Текст' },
      { type: 'paragraph', text: 'Ещё текст' },
    ])
  })

  it('возвращает пустой массив для пустого текста', () => {
    expect(parseRichText('')).toEqual([])
    expect(parseRichText('   \n  \n')).toEqual([])
  })

  it('распознаёт <ul> и вытаскивает <li>', () => {
    const blocks = parseRichText('Список:\n<ul><li>Один</li><li>Два</li></ul>')

    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Список:' },
      { type: 'list', ordered: false, items: ['Один', 'Два'] },
    ])
  })

  it('распознаёт <ol> как нумерованный список', () => {
    const blocks = parseRichText('<ol><li>Шаг 1</li><li>Шаг 2</li></ol>')

    expect(blocks).toEqual([{ type: 'list', ordered: true, items: ['Шаг 1', 'Шаг 2'] }])
  })

  it('оставляет инлайн-теги внутри пунктов списка как есть', () => {
    const blocks = parseRichText('<ul><li><strong>Жирный</strong> пункт</li></ul>')

    expect(blocks).toEqual([
      { type: 'list', ordered: false, items: ['<strong>Жирный</strong> пункт'] },
    ])
  })

  it('не теряет текст после списка', () => {
    const blocks = parseRichText('До.<ul><li>пункт</li></ul>После.')

    expect(blocks).toEqual([
      { type: 'paragraph', text: 'До.' },
      { type: 'list', ordered: false, items: ['пункт'] },
      { type: 'paragraph', text: 'После.' },
    ])
  })

  it('разбирает несколько списков подряд', () => {
    const blocks = parseRichText('<ul><li>а</li></ul>Между<ul><li>б</li></ul>')

    expect(blocks).toEqual([
      { type: 'list', ordered: false, items: ['а'] },
      { type: 'paragraph', text: 'Между' },
      { type: 'list', ordered: false, items: ['б'] },
    ])
  })

  it('игнорирует список без единого <li>', () => {
    const blocks = parseRichText('Текст<ul></ul>Продолжение')

    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Текст' },
      { type: 'paragraph', text: 'Продолжение' },
    ])
  })

  it('переживает незакрытый список', () => {
    const blocks = parseRichText('<ul><li>пункт</li>')

    expect(blocks).toEqual([{ type: 'paragraph', text: '<ul><li>пункт</li>' }])
  })
})
