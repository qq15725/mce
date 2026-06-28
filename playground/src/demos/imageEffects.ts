import type { Editor } from 'mce'
import { IMAGE_EFFECT_PIPELINE } from '@mce/bigesj'
import { normalizeEffect } from 'modern-idoc'

// 图片样式示例：bige 的「图片样式」（描边/填充/阴影/重影）现统一走 @mce/bigesj 注册的
// 内置 imageEffect 管线 —— 整组 effects 包成一个 pipeline 步骤（params.effects），
// 与 bigesj 加载 bige 数据时 element.ts 生成的数据形态一致。
// 关键点（见 bigesj 的 bakeImageEffects）：
// - effects 基于图片 alpha 轮廓（source-in），需用带透明的图（example.png 线稿），矩形图看不出效果；
// - 烘焙不会自动叠原图，空 `{}` 层才等于「画一次原图」；
// - 带 translate 的层 source-over 画在上面，不带 translate 的层 destination-over 落到背后。
// 纯像素的自定义管线（灰度/染色等）见 pipelines.ts。
export function loadImageEffectsDemo(editor: Editor): void {
  const cases: { label: string, effects?: any[] }[] = [
    { label: '无 effects' },
    { label: '描边 outline', effects: [{ outline: { width: 8, color: '#ff3366' } }] },
    { label: '填充 fill', effects: [{ fill: { color: '#22ccaa' } }] },
    { label: '渐变填充', effects: [{ fill: { linearGradient: { angle: 45, stops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#f59e0b' }] } } }] },
    { label: '投影 shadow', effects: [{ shadow: { color: '#000000aa', blur: 16, offsetX: 8, offsetY: 8 } }] },
    // 重影：填充层位移画在上，空层把原图铺在其后
    { label: '位移重影', effects: [{ fill: { color: '#ff8800' }, transform: 'translate(16, 16)' }, {}] },
    // 同心双描边：细白边在上，粗青边 destination-over 落到其后
    { label: '双重描边', effects: [{ outline: { width: 6, color: '#ffffff' } }, { outline: { width: 16, color: '#0ea5e9' } }] },
    { label: '描边+投影', effects: [{ outline: { width: 6, color: '#facc15' } }, { shadow: { color: '#00000099', blur: 14, offsetX: 6, offsetY: 6 } }] },
  ]
  const COLS = 4
  const CELL_W = 220
  const CELL_H = 230
  const TILE = 170
  const nodes: any[] = []
  cases.forEach((c, i) => {
    const x = (i % COLS) * CELL_W
    const y = Math.floor(i / COLS) * CELL_H
    nodes.push({
      id: `ie-${i}`,
      style: { left: x, top: y, width: TILE, height: TILE, backgroundColor: '#ffffff' },
      foreground: {
        image: '/example.png',
        fillWithShape: true,
        // 整组 effects 包成单个 imageEffect 管线步骤（保留跨层合成语义），由 @mce/bigesj 烘焙。
        ...(c.effects ? { pipelines: [{ name: IMAGE_EFFECT_PIPELINE, params: { effects: c.effects.map(normalizeEffect) } }] } : {}),
      },
      meta: { inCanvasIs: 'Element2D', inPptIs: 'Picture' },
    })
    nodes.push({
      id: `ie-lbl-${i}`,
      style: { left: x, top: y + TILE + 6, width: TILE, height: 24, fontSize: 14, color: '#1a1a2e', textAlign: 'center' },
      text: c.label,
      meta: { inCanvasIs: 'Element2D' },
    })
  })
  editor.setDoc(nodes as any)
  setTimeout(() => editor.exec('zoomToFit'), 100)
}
