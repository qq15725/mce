import type { Editor } from 'mce'
import { registerDeformations } from 'modern-text/deformations'

// 文字特性总览：把 modern-text / modern-canvas 支持的文字能力都用一个个带标签的小卡片展示出来。
// 含基础排版、装饰与划重点(highlight)、填充与效果、以及文字变形(deformation)。

// modern-text 核心不内置变形预设，需手动注册一次(34 个内置变形)。
let _deformationsRegistered = false
function ensureDeformations(): void {
  if (_deformationsRegistered)
    return
  registerDeformations()
  _deformationsRegistered = true
}

// 内联 SVG 数据 URI（划重点用的手绘标记，画在文字底层）。base64 形式，highlight 插件解码后解析。
function svg(markup: string): string {
  return `data:image/svg+xml;base64,${btoa(markup)}`
}
// 黄色荧光笔涂抹
const HL_MARKER = svg('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="44" viewBox="0 0 120 44"><rect x="3" y="14" width="114" height="24" rx="11" fill="#ffe066" opacity="0.75"/></svg>')
// 红色波浪下划线
const HL_SQUIGGLE = svg('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="44" viewBox="0 0 120 44"><path d="M4 36 Q 19 26 34 33 T 64 33 T 94 33 T 118 32" stroke="#fa5252" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>')
// 蓝色圈选
const HL_CIRCLE = svg('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="48" viewBox="0 0 120 48"><path d="M60 5 C 18 4 6 22 12 33 C 20 47 96 47 108 33 C 116 21 100 6 56 7" stroke="#4dabf7" stroke-width="3" fill="none" stroke-linecap="round"/></svg>')

interface Card {
  label: string
  text: any // string | { content: [...] }
  style?: Record<string, any>
  fontSize?: number
  effects?: any[]
  deformation?: any
  fill?: any
  outline?: any
  h?: number
}

// 一条多片段的行（同一段落内若干 fragment）。
function frags(...fragments: any[]): any {
  return { content: [{ fragments }] }
}
// 多段落（每段一行）。
function lines(...paras: any[]): any {
  return { content: paras.map(p => (typeof p === 'string' ? { fragments: [{ content: p }] } : p)) }
}

const LONG_TEXT = [
  '在无限画布编辑器里，文字既要在 100% 看清每一个笔画，也要在缩到很小或放到很大时保持稳定。',
  '渲染管线把每个唯一字形只栅格化一次到共享图集，再以逐字形 quad 批量绘制；同一图集的字形会塌缩进极少的绘制调用，编辑、缩放、拖拽时只需重新定位 quad，而不必整篇重新光栅化。',
  '排版需要处理换行、断行、行高、字距、标点避头尾、中英文混排与基线对齐等细节；段落越长，布局与重排的开销越明显。',
  'A quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
  '因此，大段文本是检验编辑器性能的好场景：引擎按段落做增量布局，未变的段落整体复用、仅平移，只重排受影响的那一段，于是逐键编辑能稳定在个位毫秒。',
].join('\n')

export function loadTextFeaturesDemo(editor: Editor): void {
  ensureDeformations()

  const cards: Card[] = [
    // ── 基础排版 ──
    { label: '字号 / 字重', text: frags({ content: '大', fontSize: 44, fontWeight: 700 }, { content: '中', fontSize: 30 }, { content: '小', fontSize: 18 }) },
    { label: '斜体 italic', text: '斜体 Italic', style: { fontStyle: 'italic', color: '#7048e8' } },
    { label: '字间距 letter-spacing', text: '字 间 距', style: { letterSpacing: 8, color: '#1c7ed6' } },
    { label: '行高 line-height', text: '行高控制\n上下行间距', style: { lineHeight: 1.9, fontSize: 22 }, h: 130 },
    { label: '首行缩进 text-indent', text: '首行缩进两字\n第二行不缩进对照', style: { textIndent: 44, fontSize: 20 }, h: 130 },
    { label: '居中对齐 center', text: '居中\ncenter', style: { textAlign: 'center', fontSize: 22 }, h: 130 },
    { label: '右对齐 right', text: '右对齐\nright', style: { textAlign: 'right', fontSize: 22 }, h: 130 },
    { label: '两端对齐 justify', text: 'justify 两端对齐效果演示文本', style: { textAlign: 'justify', fontSize: 18 }, h: 130 },
    { label: '文本变换 uppercase', text: frags({ content: 'Hello ', textTransform: 'none' }, { content: 'world', textTransform: 'uppercase' }) },
    { label: '字重梯度 font-weight', text: frags({ content: 'A', fontWeight: 100 }, { content: 'a', fontWeight: 400 }, { content: 'B', fontWeight: 700 }, { content: 'b', fontWeight: 900 }) },
    { label: '竖排 vertical-rl', text: '竖排文字\n从右到左', style: { writingMode: 'vertical-rl', fontSize: 22 }, h: 150 },
    { label: '垂直对齐 vertical-align', text: frags({ content: '大', fontSize: 38 }, { content: 'base', verticalAlign: 'baseline', fontSize: 16 }, { content: 'top', verticalAlign: 'top', fontSize: 16 }, { content: 'mid', verticalAlign: 'middle', fontSize: 16 }) },

    // ── 装饰 / 划重点 ──
    { label: '下划线 underline', text: '下划线 underline', style: { textDecoration: 'underline', color: '#2f9e44' } },
    { label: '删除线 line-through', text: '删除线 strike', style: { textDecoration: 'line-through', color: '#e03131' } },
    { label: '划重点·荧光笔', text: frags({ content: '划' }, { content: '重点', highlightImage: HL_MARKER }, { content: '标记' }), fontSize: 30 },
    { label: '划重点·波浪线', text: frags({ content: '重要' }, { content: '提示', highlightImage: HL_SQUIGGLE }), fontSize: 30 },
    { label: '划重点·圈选', text: frags({ content: '圈' }, { content: '住它', highlightImage: HL_CIRCLE }), fontSize: 30 },
    { label: '描边文字 textStroke', text: '描边 Stroke', style: { color: '#ffd43b', fontWeight: 700 }, effects: [{ textStrokeWidth: 0.06, textStrokeColor: '#e8590c', color: '#ffd43b' }] },
    { label: '列表 list-style', text: lines({ content: '第一项', listStyleType: 'disc' }, { content: '第二项', listStyleType: 'disc' }, { content: '第三项', listStyleType: 'disc' }), style: { fontSize: 20 }, h: 130 },

    // ── 填充 / 效果 ──
    { label: '渐变填充', text: frags({ content: '渐变填充', fill: { linearGradient: { angle: 90, stops: [{ offset: 0, color: '#7048e8' }, { offset: 1, color: '#f06595' }] } } }), fontSize: 32 },
    { label: '图片填充', text: frags({ content: '图片', fill: { image: '/example.jpg' } }), fontSize: 48 },
    { label: '投影 shadow', text: '投影 Shadow', style: { color: '#ffffff', fontWeight: 700 }, effects: [{ shadowColor: '#00000088', shadowBlur: 0.12, shadowOffsetX: 0.06, shadowOffsetY: 0.06, color: '#495057' }] },
    { label: '描边效果 outline', text: '外描边', style: { color: '#ffffff', fontWeight: 700, fontSize: 36 }, effects: [{ outline: { width: 0.08, color: '#1971c2' }, color: '#ffffff' }] },
    { label: '双层描边', text: '双描边', style: { color: '#ffffff', fontWeight: 700, fontSize: 36 }, effects: [{ outline: { width: 0.05, color: '#ffffff' }, color: '#ffffff' }, { outline: { width: 0.14, color: '#f06595' }, color: '#ffffff' }] },
    { label: '位移重影 layered', text: '重影', style: { fontWeight: 700, fontSize: 40 }, effects: [{ color: '#ff8787', translateX: 0.06, translateY: 0.06 }, { color: '#1098ad' }] },

    // ── 文字变形 deformation ──
    { label: '拱形 arch-curve', text: 'ARCH 拱形', deformation: { type: 'arch-curve', intensities: [50] }, fontSize: 30, h: 150 },
    { label: '弯曲 bend', text: 'BEND 弯曲', deformation: { type: 'bend', intensities: [50] }, fontSize: 30, h: 150 },
    { label: '波浪 wave', text: 'WAVE波浪', deformation: { type: 'wave-by-word', intensities: [40] }, fontSize: 30, h: 150 },
    { label: '旗帜 flag', text: 'FLAG旗帜', deformation: { type: 'flag-curve', intensities: [40] }, fontSize: 30, h: 150 },
    { label: '梯形 trapezoid', text: '梯形TRAP', deformation: { type: 'trapezoid', intensities: [40, 40] }, fontSize: 30, h: 150 },
    { label: '鼓起 bulb', text: '鼓起BULB', deformation: { type: 'bulb-curve', intensities: [40] }, fontSize: 30, h: 150 },
    { label: '倾斜 skew', text: '倾斜SKEW', deformation: { type: 'skew', intensities: [30] }, fontSize: 30, h: 150 },
    { label: '凹陷 concave', text: '凹陷CONC', deformation: { type: 'concave-curve', intensities: [40] }, fontSize: 30, h: 150 },
  ]

  // 一个特性 = 一个画板(Frame)，画板名就是特性名（图层面板/画布上直接显示），画板里放演示文字。
  const frame = (name: string, style: Record<string, any>): any => ({
    name,
    meta: { inCanvasIs: 'Element2D', inEditorIs: 'Frame', inPptIs: 'Slide' },
    style: { overflow: 'visible', backgroundColor: '#ffffff', borderRadius: 14, ...style },
  })
  // 把 effects/deformation/fill/outline 挂到 text(TextProperties) 里（与 content 同级）。
  const textOf = (c: Card): any => {
    const t: any = typeof c.text === 'string' ? { content: c.text } : { ...c.text }
    if (c.effects)
      t.effects = c.effects
    if (c.deformation)
      t.deformation = c.deformation
    if (c.fill)
      t.fill = c.fill
    if (c.outline)
      t.outline = c.outline
    return t
  }

  editor.setDoc([])

  const COLS = 5
  const CELL_W = 320
  const CELL_H = 240
  const FRAME_W = 296
  const FRAME_H = 184
  cards.forEach((c, i) => {
    const x = (i % COLS) * CELL_W
    const y = Math.floor(i / COLS) * CELL_H
    const fr = editor.addElement(frame(c.label, { left: x, top: y, width: FRAME_W, height: FRAME_H }))
    const th = c.h ?? 90
    editor.addElement({
      style: {
        left: 20,
        top: Math.max(14, (FRAME_H - th) / 2),
        width: FRAME_W - 40,
        height: th,
        fontSize: c.fontSize ?? 26,
        color: '#1f2937',
        ...c.style,
      },
      text: textOf(c),
      meta: { inCanvasIs: 'Element2D' },
    }, { parent: fr })
  })

  // 网格之后：超大文字 / 大段长文 也各自一个画板。
  let y2 = Math.ceil(cards.length / COLS) * CELL_H + 40

  const bigFr = editor.addElement(frame('超大文字 · 放大依旧清晰', { left: 0, top: y2, width: 2700, height: 840 }))
  editor.addElement({ style: { left: 30, top: 30, width: 2600, height: 300, fontSize: 220, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }, text: { content: '超大文字 BIG' }, meta: { inCanvasIs: 'Element2D' } }, { parent: bigFr })
  editor.addElement({ style: { left: 30, top: 360, width: 1900, height: 460, fontSize: 110, color: '#1971c2', lineHeight: 1.4 }, text: { content: '无限渲染\n放大依旧清晰\n缩小也不糊' }, meta: { inCanvasIs: 'Element2D' } }, { parent: bigFr })
  y2 += 920

  const paraFr = editor.addElement(frame('大段长文 · 排版与编辑', { left: 0, top: y2, width: 1180, height: 700 }))
  editor.addElement({ style: { left: 30, top: 30, width: 1100, height: 640, fontSize: 26, color: '#1f2937', lineHeight: 1.85 }, text: { content: LONG_TEXT }, meta: { inCanvasIs: 'Element2D' } }, { parent: paraFr })

  setTimeout(() => editor.exec('zoomToFit'), 150)
}
