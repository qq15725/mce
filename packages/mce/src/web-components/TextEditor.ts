import type {
  NormalizedFragment,
  NormalizedParagraph,
  NormalizedTextContent,
  PropertyAccessor,
} from 'modern-idoc'
import type { Character } from 'modern-text'
import { diffChars } from 'diff'
import { isCRLF, normalizeCRLF, normalizeTextContent, property, textContentToString } from 'modern-idoc'
import { Text } from 'modern-text'

export interface IndexCharacter {
  paragraphIndex: number
  fragmentIndex: number
  charIndex: number
  color: string
  left: number
  top: number
  width: number
  height: number
  content: string
  isFirst?: boolean
  isLast?: boolean
  isLastSelected?: boolean
  isCrlf?: boolean
}

function normalizeStyle(style: Record<string, any>): Record<string, any> {
  const newStyle: Record<string, any> = {}
  for (const key in style) {
    if (key !== 'id' && style[key] !== undefined && style[key] !== '') {
      newStyle[key] = style[key]
    }
  }
  return newStyle
}

function textContentToCharStyles(textContent: NormalizedTextContent): Record<string, any>[] {
  return textContent.flatMap((p) => {
    const { fragments } = p
    const res = fragments.flatMap((f) => {
      const { content, ...fStyle } = f
      return Array.from(normalizeCRLF(content)).map(() => ({ ...fStyle }))
    })
    if (isCRLF(normalizeCRLF(fragments[fragments.length - 1]?.content ?? ''))) {
      return res
    }
    return [...res, {}]
  })
}

function isEqualStyle(style1: Record<string, any>, style2: Record<string, any>): boolean {
  const keys1 = Object.keys(style1)
  const keys2 = Object.keys(style2)
  const keys = Array.from(new Set([...keys1, ...keys2]))
  return !keys.length || keys.every(key => style1[key] === style2[key])
}

function parseHTML(html: string): HTMLElement {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content.cloneNode(true) as HTMLElement
}

const SUPPORTS_POINTER_EVENTS = 'PointerEvent' in globalThis

export class TextEditor extends HTMLElement implements PropertyAccessor {
  @property({ fallback: 0 }) declare left: number
  @property({ fallback: 0 }) declare top: number
  @property({ fallback: 0 }) declare rotate: number
  @property() declare selection: [number, number] | undefined

  @property({ internal: true, fallback: () => ({ min: -1, max: -1 }) })
  declare protected _selectionMinMax: { min: number, max: number }

  @property({ internal: true, fallback: () => ([] as IndexCharacter[]) })
  declare protected _chars: IndexCharacter[]

  @property({ internal: true, fallback: () => ([] as IndexCharacter[]) })
  declare protected _selectedChars: IndexCharacter[]

  @property({ internal: true })
  declare protected _cursorPosition?: { left: number, top: number, width: number, height: number, color: string }

  @property({ internal: true, fallback: false })
  declare protected _showCursor: boolean

  protected static _defined = false
  static register(): void {
    if (!this._defined) {
      this._defined = true
      customElements.define('text-editor', this)
    }
  }

  protected _text = new Text()
  get text(): Text { return this._text }
  set text(newText: Text) {
    if (newText) {
      this._text?.off('update', this._update)
      this.reset()
      newText.on('update', this._update)
      this._text = newText
      this._setTextInput(this.getPlaintext())
      this.text.update()
      this._update()
    }
  }

  protected _oldText = ''
  protected _container: HTMLDivElement
  protected _selection: HTMLDivElement
  protected _textarea: HTMLTextAreaElement
  protected _cursor: HTMLElement

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })

    shadowRoot.appendChild(
      parseHTML(`
  <style>
  :host {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    z-index: 1;
  }

  .container {
    position: absolute;
  }

  textarea {
    position: absolute;
    opacity: 0;
    caret-color: transparent;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    resize: none;
    overflow: hidden;
  }

  .selection {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
  }

  .selection > * {
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(var(--color, 0, 0, 0), 0.4);
  }

  .cursor {
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
  }

  .cursor.blink {
    animation: cursor-blink 1s steps(2, start) infinite;
  }

  @keyframes cursor-blink {
    100% {
      visibility: hidden;
    }
  }
  </style>

  <div class="container">
    <textarea name="text-content" spellcheck="false"></textarea>
    <div class="selection"></div>
    <div class="cursor blink"></div>
  </div>
`),
    )

    this._container = shadowRoot.querySelector('.container') as HTMLDivElement
    this._selection = shadowRoot.querySelector('.selection') as HTMLDivElement
    this._textarea = shadowRoot.querySelector('textarea') as HTMLTextAreaElement
    this._cursor = shadowRoot.querySelector('.cursor') as HTMLElement
    this._bindEventListeners()
    this._update = this._update.bind(this)
  }

  connectedCallback(): void {
    this._emit('init')
  }

  moveToDom(target: HTMLElement): void {
    const style = getComputedStyle(target)
    const host = this.shadowRoot!.host as HTMLElement
    host.style.width = `${target.clientWidth}px`
    host.style.height = `${target.clientHeight}px`
    host.style.transform = ''
    const hostRect = host.getBoundingClientRect()
    const hostCenter = { x: hostRect.x + hostRect.width / 2, y: hostRect.y + hostRect.height / 2 }
    const targetRect = target.getBoundingClientRect()
    const targetCenter = { x: targetRect.x + targetRect.width / 2, y: targetRect.y + targetRect.height / 2 }
    this.left = targetCenter.x - hostCenter.x
    this.top = targetCenter.y - hostCenter.y
    const m = new DOMMatrixReadOnly(style.transform)
    this.rotate = Math.atan2(m.b, m.a) * (180 / Math.PI)
    this._update()
  }

  set(text: Text): void {
    this.text = text
  }

  onUpdateProperty(key: string, _newValue: unknown, _oldValue: unknown): void {
    switch (key) {
      case 'selection':
        if (this.selection) {
          this._selectionMinMax = {
            min: Math.min(...this.selection),
            max: Math.max(...this.selection),
          }
          this._showCursor = true
        }
        else {
          this._selectionMinMax = {
            min: -1,
            max: -1,
          }
          this._showCursor = false
        }
        break
      case '_selectionMinMax':
      case '_chars':
        this._updateSelectedChars()
        this._updateCursorPosition()
        break
      case '_showCursor':
      case '_cursorPosition':
        this._renderCursor()
        break
      case '_selectedChars':
        this._renderCursor()
        this._renderSelectRange()
        break
      case 'left':
      case 'top':
      case 'rotate':
        this._update()
        break
    }
  }

  protected _updateChars(): void {
    const paragraphs: Character[][][] = []
    this.text.paragraphs.forEach((p, paragraphIndex) => {
      p.fragments.forEach((f, fragmentIndex) => {
        f.characters.forEach((c) => {
          if (!paragraphs[paragraphIndex])
            paragraphs[paragraphIndex] = []
          if (!paragraphs[paragraphIndex][fragmentIndex])
            paragraphs[paragraphIndex][fragmentIndex] = []
          paragraphs[paragraphIndex][fragmentIndex].push(c)
        })
      })
    })
    const toIndexChar = (c: Character): IndexCharacter => {
      return {
        paragraphIndex: -1,
        fragmentIndex: -1,
        charIndex: -1,
        color: c.computedStyle.color,
        left: c.inlineBox.left,
        top: c.inlineBox.top,
        width: c.inlineBox.width,
        height: c.inlineBox.height,
        content: c.content,
      }
    }
    const chars: IndexCharacter[] = []
    let pos = 0
    paragraphs.forEach((p, paragraphIndex) => {
      if (p.length === 1 && p[0].length === 1 && isCRLF(p[0][0].content)) {
        const c = p[0][0]
        chars[pos] = {
          ...toIndexChar(c),
          paragraphIndex,
          fragmentIndex: 0,
          charIndex: 0,
          isCrlf: true,
        }
      }
      else {
        p.forEach((f, fragmentIndex) => {
          f.forEach((c, charIndex) => {
            const char = toIndexChar(c)
            chars[pos] = {
              ...char,
              paragraphIndex,
              fragmentIndex,
              charIndex,
            }
            pos++
            if (!isCRLF(c.content)) {
              chars[pos] = {
                ...char,
                paragraphIndex,
                fragmentIndex,
                charIndex,
                content: ' ',
                isLastSelected: true,
              }
            }
          })
        })
      }
      pos++
    })
    if (chars[0]) {
      chars[0].isFirst = true
    }
    if (chars[chars.length - 1]) {
      chars[chars.length - 1].isLast = true
    }
    this._chars = chars
  }

  protected _updateSelectedChars(): void {
    this._selectedChars = this._chars.filter((_char, index) => {
      return index >= this._selectionMinMax.min
        && index < this._selectionMinMax.max
    })
    if (this._selectionMinMax.min > -1) {
      this._emit('selected', [
        this._chars[this._selectionMinMax.min],
        this._chars[this._selectionMinMax.max],
      ])
    }
    else {
      this._emit('selected', undefined)
    }
  }

  protected _updateCursorPosition(): void {
    let left = 0
    let top = 0
    const char = this._chars[this._selectionMinMax.min]
    if (char?.isLastSelected) {
      if (this.text.isVertical) {
        top += char?.height ?? 0
      }
      else {
        left += char?.width ?? 0
      }
    }
    left += char?.left ?? 0
    top += char?.top ?? 0
    // 光标可能落在没有对应字符的位置（空文本 / 行尾 / 越界），此时 char 为空。
    // 高度必须回退到「字号 × 行高」——取 0 的话光标虽然 display:block 但高度为 0，看着就是不渲染。
    const { fontSize, lineHeight } = this.text.computedStyle
    const fallbackSize = fontSize * (Number.isFinite(lineHeight) ? Number(lineHeight) : 1)
    this._cursorPosition = {
      color: char?.color,
      left,
      top,
      height: char?.height || fallbackSize,
      width: char?.width || fontSize,
    }
  }

  getPlaintext(): string {
    return textContentToString(
      this._getNewContent(
        this.text.content,
      ),
    )
  }

  protected _getNewContent(
    content: NormalizedTextContent,
    newString = textContentToString(content),
    oldString = newString,
  ): NormalizedTextContent {
    // 1. normalize text
    newString = normalizeCRLF(newString)
    oldString = normalizeCRLF(oldString)
    // 2. diff style
    const oldStyles = textContentToCharStyles(content)
    const styles: Record<string, any>[] = []
    let styleIndex = 0
    let oldStyleIndex = 0
    let prevOldStyle: Record<string, any> = {}
    const changes = diffChars(oldString, newString)
    changes.forEach((change) => {
      const chars = Array.from(change.value)
      if (change.removed) {
        // Inherit the style at the start of the removed range so a typed
        // replacement (e.g. select-all then type) keeps the original styling
        // instead of falling back to empty defaults.
        prevOldStyle = normalizeStyle(oldStyles[oldStyleIndex] ?? {})
        oldStyleIndex += chars.length
      }
      else {
        chars.forEach(() => {
          if (change.added) {
            styles[styleIndex] = { ...prevOldStyle }
          }
          else {
            prevOldStyle = normalizeStyle(oldStyles[oldStyleIndex])
            styles[styleIndex] = { ...prevOldStyle }
            oldStyleIndex++
          }
          styleIndex++
        })
      }
    })
    // 3. create new content
    let charIndex = 0
    const newContents: NormalizedTextContent = []
    normalizeTextContent(newString).forEach((p, pI) => {
      const { fragments: _, ...pStyle } = content[pI] ?? {}
      let newParagraph: NormalizedParagraph = { ...pStyle, fragments: [] }
      let newFragment: NormalizedFragment | undefined
      p.fragments.forEach((f) => {
        Array.from(f.content).forEach((char) => {
          const style = styles[charIndex] ?? {}
          if (newFragment) {
            const { content: _, ..._style } = newFragment
            if (isEqualStyle(style, _style)) {
              newFragment.content += char
            }
            else {
              newParagraph.fragments.push(newFragment)
              newFragment = { ...style, content: char }
            }
          }
          else {
            newFragment = { ...style, content: char }
          }
          charIndex++
        })
      })
      if (!isCRLF(p.fragments[p.fragments.length - 1]?.content ?? '')) {
        charIndex++
      }
      if (newFragment) {
        newParagraph.fragments.push(newFragment)
      }
      if (newParagraph.fragments.length) {
        newContents.push(newParagraph)
        newParagraph = { ...pStyle, fragments: [] }
      }
    })
    return newContents
  }

  protected _setTextInput(newText: string): void {
    this._textarea.value = newText
    this._oldText = newText
  }

  protected _onInput(): void {
    const newText = this._textarea.value
    this.text.content = this._getNewContent(
      this.text.content,
      newText,
      // oldString 必须与 oldStyles（取自 content）的字符表示一致：用 content 的原始字符串，
      // 而非 textarea 里已被 emoji→'?' 替换过的 _oldText——否则 emoji 处字符数不一致会让样式整体错位。
      textContentToString(this.text.content),
    )
    this._oldText = newText
    this.text.update()
    this._emit('update')
  }

  protected _timer?: any

  protected _onKeydown(e: KeyboardEvent): void {
    e.stopPropagation()

    if (
      e.key === 'Escape'
      || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')
    ) {
      this.selection = undefined
      this._textarea.blur()
      this._emit('submit')
      return
    }

    this._updateSelectionByDom()
    setTimeout(() => this._updateSelectionByDom(), 0)
    setTimeout(() => this._updateSelectionByDom(), 100)
  }

  protected _findNearest(options: {
    x: number
    y: number
    xWeight?: number
    yWeight?: number
  }): number {
    const isVertical = this.text.isVertical
    const { boundingBox } = this.text

    const {
      xWeight = 1,
      yWeight = 1,
    } = options

    // Pointer coords are in host space; `_chars` use `inlineBox` coords. The
    // container is offset by `-boundingBox.left/top`, so undo that here. Matters
    // whenever shadow/outline expands the box past the text baseline (negative
    // offsets in particular).
    const x = options.x + boundingBox.left
    const y = options.y + boundingBox.top

    const char = this._chars.reduce(
      (prev, current, index) => {
        const diff = (
          Math.abs(current.left + current.width / 2 - x) * xWeight
          + Math.abs(current.top + current.height / 2 - y) * yWeight
        )
        if (diff < prev.diff) {
          return {
            diff,
            index,
            value: current,
          }
        }
        return prev
      },
      {
        diff: Number.MAX_SAFE_INTEGER,
        index: -1,
        value: undefined as IndexCharacter | undefined,
      },
    )

    if (char?.value) {
      if (
        (
          isVertical
            ? (y > char.value.top + char.value.height / 2)
            : (x > char.value.left + char.value.width / 2)
        )
        && !char.value.isCrlf
        && !char.value.isLastSelected
      ) {
        return char.index + 1
      }
      return char.index
    }

    return -1
  }

  protected _updateSelectionByDom(): void {
    const { selectionStart, selectionEnd } = this._textarea
    let count = 0
    const _selection: [number, number] = [-1, -1]
    this._chars.forEach((char, index) => {
      if (count <= selectionStart) {
        _selection[0] = index
      }
      if (count <= selectionEnd) {
        _selection[1] = index
      }
      count += char.content.length
    })
    this.selection = _selection
  }

  protected _updateDomSelection(): void {
    let start = 0
    let end = 0
    this._chars.forEach((char, index) => {
      if (index < this._selectionMinMax.min) {
        start += char.content.length
        end = start
      }
      else if (index < this._selectionMinMax.max) {
        end += char.content.length
      }
    })
    this._textarea.selectionStart = start
    this._textarea.selectionEnd = end
  }

  protected _update(): void {
    this._updateChars()
    const { boundingBox, lineBox } = this.text
    const host = this.shadowRoot!.host as HTMLElement
    const radian = this.rotate * Math.PI / 180
    const cos = Math.cos(radian)
    const sin = Math.sin(radian)
    host.style.transform = `matrix(${cos}, ${sin}, ${-sin}, ${cos}, ${this.left}, ${this.top})`
    host.style.width = `${boundingBox.width}px`
    host.style.height = `${boundingBox.height}px`
    this._container.style.left = `${-boundingBox.left}px`
    this._container.style.top = `${-boundingBox.top}px`
    this._container.style.width = `${lineBox.width}px`
    this._container.style.height = `${lineBox.height}px`
    this._textarea.style.fontSize = `${this.text.computedStyle.fontSize}px`
    this._textarea.style.writingMode = this.text.computedStyle.writingMode
    this._renderSelectRange()
    this._renderCursor()
  }

  protected _bindEventListeners(): void {
    this._textarea.addEventListener('keydown', this._onKeydown.bind(this))
    this._textarea.addEventListener('input', this._onInput.bind(this) as any)
    if (SUPPORTS_POINTER_EVENTS) {
      this._textarea.addEventListener('pointerdown', this.pointerDown.bind(this) as any)
    }
    else {
      this._textarea.addEventListener('mousedown', this.pointerDown.bind(this) as any)
    }
    ;['keydown', 'keypress', 'keyup', 'input', 'focus', 'blur', 'selectionchange', 'selectionstart'].forEach((key) => {
      this._textarea.addEventListener(key, () => this._updateSelectionByDom())
    })
  }

  pointerDown(e?: MouseEvent | PointerEvent, positionOnly = false): boolean {
    if (e && e.button !== 0) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    const isVertical = this.text.isVertical
    const host = this.shadowRoot!.host as HTMLElement
    const clientRect = host.getBoundingClientRect()
    const { clientWidth: width, clientHeight: height } = host
    const scaleX = clientRect.width / width
    const scaleY = clientRect.height / height
    const radian = this.rotate * Math.PI / 180
    const cos = Math.cos(radian)
    const sin = Math.sin(radian)
    const m = new DOMMatrixReadOnly([cos, sin, -sin, cos, 0, 0]).inverse()
    const clientCenter = { x: clientRect.x + clientRect.width / 2, y: clientRect.y + clientRect.height / 2 }
    const center = { x: clientCenter.x / scaleX, y: clientCenter.y / scaleY }

    let x = 0
    let y = 0

    const getXy = (e: MouseEvent): { x: number, y: number } => {
      const _p = m.transformPoint({
        x: e.clientX - clientCenter.x,
        y: e.clientY - clientCenter.y,
      })

      const p = {
        x: (_p.x + clientCenter.x) / scaleX,
        y: (_p.y + clientCenter.y) / scaleY,
      }

      if (isVertical) {
        return {
          x: (center.x + width / 2) - p.x,
          y: p.y - (center.y - height / 2),
        }
      }
      else {
        return {
          x: p.x - (center.x - width / 2),
          y: p.y - (center.y - height / 2),
        }
      }
    }

    if (e) {
      ;({ x, y } = getXy(e))

      e.preventDefault()
      e.stopPropagation()
    }

    const index = this._findNearest({ x, y })
    this.selection = [index, index]
    this._updateDomSelection()

    if (!positionOnly && e && ['mousedown', 'pointerdown'].includes(e.type)) {
      const onMove = (e: MouseEvent): void => {
        this.selection = [
          index,
          this._findNearest(getXy(e)),
        ]

        this._updateDomSelection()
      }
      const onUp = (): void => {
        if (SUPPORTS_POINTER_EVENTS) {
          document.removeEventListener('pointermove', onMove)
          document.removeEventListener('pointerup', onUp)
        }
        else {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onUp)
        }
      }
      if (SUPPORTS_POINTER_EVENTS) {
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
      }
      else {
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
      }
    }

    this._textarea.focus()

    return true
  }

  selectAll(): void {
    this._textarea.focus()
    this._textarea.select()
    this._updateSelectionByDom()
  }

  /** 重新聚焦隐藏 textarea，但不改变当前选区（用于进入编辑后保留点击处光标）。 */
  focus(): void {
    this._textarea.focus()
  }

  attributeChangedCallback(name: string, _oldValue: any, newValue: any): void {
    ;(this as any)[name] = newValue
  }

  protected _emit(type: string, detail?: any): boolean {
    return this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        detail,
      }),
    )
  }

  protected _renderSelectRange(): void {
    const isVertical = this.text.isVertical
    const boxesGroupsMap: Record<number, Record<string, any>[]> = {}
    this._selectedChars.forEach((char) => {
      if (char.isLastSelected) {
        return
      }
      const key = isVertical
        ? char.left
        : char.top
      if (!boxesGroupsMap[key]) {
        boxesGroupsMap[key] = []
      }
      boxesGroupsMap[key].push({
        x: char.left,
        y: char.top,
        w: char.width,
        h: char.height,
      })
    })
    const boxesGroups = Object.values(boxesGroupsMap)
    const sourceLen = this._selection.children.length
    const targetLen = boxesGroups.length
    const len = Math.max(sourceLen, targetLen)

    const deleted: (HTMLElement | undefined)[] = []
    for (let i = 0; i < len; i++) {
      let element = this._selection.children.item(i) as HTMLElement | undefined
      const boxes = boxesGroups[i]
      if (!boxes) {
        deleted.push(element)
        continue
      }
      else if (!element) {
        element = document.createElement('div')
        this._selection.append(element)
      }
      const min = {
        x: Math.min(...boxes.map(v => v.x)),
        y: Math.min(...boxes.map(v => v.y)),
      }
      const max = {
        x: Math.max(...boxes.map(v => v.x + v.w)),
        y: Math.max(...boxes.map(v => v.y + v.h)),
      }
      element.style.width = `${max.x - min.x}px`
      element.style.height = `${max.y - min.y}px`
      element.style.transform = `translate(${min.x}px, ${min.y}px)`
    }

    deleted.forEach(el => el?.remove())
  }

  protected _renderCursor(): void {
    if (
      this._showCursor
      && this._cursorPosition
      && this._selectedChars.length === 0
    ) {
      const _cursorPosition = this._cursorPosition
      // 粗细：这里是元素局部坐标系，写死 1px 会跟着画布缩放一起缩小（画布 25% 时屏幕上只剩
      // 0.25px，几乎看不见）。按宿主的实际屏幕缩放反算，使其在屏幕上恒定约 1.5px。
      const host = this.shadowRoot!.host as HTMLElement
      const scale = host.clientWidth ? host.getBoundingClientRect().width / host.clientWidth : 1
      const thickness = Math.max(1, 1.5 / (scale || 1))
      this._cursor.style.display = 'block'
      // 颜色：CSSOM 会静默丢弃无效值，所以这里「先清空 → 试着设 → 没设进去就回退」。
      // 两种值都设不进去：带 var() 的（原来的 `rgba(var(--color))` 从没生效过，光标一直透明）、
      // 以及画布文字色可能是 `@on-surface` 这类未解析的主题 token。
      const rgb = getComputedStyle(host).getPropertyValue('--color').trim()
      this._cursor.style.backgroundColor = ''
      if (_cursorPosition.color) {
        this._cursor.style.backgroundColor = _cursorPosition.color
      }
      if (!this._cursor.style.backgroundColor) {
        this._cursor.style.backgroundColor = rgb ? `rgb(${rgb})` : '#000'
      }
      this._cursor.style.left = `${_cursorPosition.left}px`
      this._cursor.style.top = `${_cursorPosition.top}px`
      this._cursor.style.height = this.text.isVertical ? `${thickness}px` : `${_cursorPosition.height}px`
      this._cursor.style.width = this.text.isVertical ? `${_cursorPosition.width}px` : `${thickness}px`
    }
    else {
      this._cursor.style.display = 'none'
    }
    this._cursor.classList.remove('blink')
    if (this._timer) {
      clearTimeout(this._timer)
    }
    this._timer = setTimeout(() => this._cursor.classList.add('blink'), 500)
  }

  reset(): void {
    this.selection = undefined
  }
}
