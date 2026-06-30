import type { Editor } from 'mce'

// 大文本示例：演示「超大文字也能渲染」+「放大自动按显示分辨率重栅格保持清晰」。
// 历史上文字纹理固定 2 倍像素密度，超大字号的纹理会超过 GPU MAX_TEXTURE_SIZE 而整块空白；
// 现在引擎按显示密度栅格并封顶上限，任意大小都能渲染，放大时还会自动变清晰。
export function loadBigTextDemo(editor: Editor): void {
  editor.setDoc([
    // 巨型标题：字号极大，旧实现下纹理超限会渲染不出来，现在正常显示。
    // 文字元素的命中区域取 style 的 width×height，所以必须显式给 height，否则盒高为 0 选不中。
    {
      id: 'big-title',
      style: { left: 0, top: 0, width: 5200, height: 1340, fontSize: 880, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 },
      text: { content: '超大文本 BIG' },
      meta: { inCanvasIs: 'Element2D' },
    },
    // 超长多行：高度方向也会撑爆纹理上限，验证纵向同样不再消失。
    {
      id: 'tall-paragraph',
      style: { left: 0, top: 1500, width: 2600, height: 1240, fontSize: 220, color: '#334155', lineHeight: 1.35 },
      text: { content: '第一行 · 无限渲染\n第二行 · 不再空白\n第三行 · 放大依旧清晰\n第四行 · OK' },
      meta: { inCanvasIs: 'Element2D' },
    },
    // 常规小字：放大到很高时会自动按显示分辨率重栅格保持锐利（对比体验）。
    {
      id: 'normal-text',
      style: { left: 2900, top: 1500, width: 1600, height: 290, fontSize: 96, color: '#2563eb', lineHeight: 1.4 },
      text: { content: '放大我看看\nZoom in for crisp text' },
      meta: { inCanvasIs: 'Element2D' },
    },
  ] as any)
  setTimeout(() => editor.exec('zoomToFit'), 120)
}
