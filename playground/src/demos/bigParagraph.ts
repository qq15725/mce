import type { Editor } from 'mce'

// 大段文本示例：单个文字元素装一篇数千字长文（定宽自动换行成上百行），
// 用来压测「大段多行文字」的排版 + 栅格/分块平铺/缩放性能。
const PARAGRAPH = [
  '在无限画布编辑器里，文字既要在 100% 看清每一个笔画，也要在缩到很小或放到很大时保持稳定。',
  '渲染管线把每段文字光栅化成纹理再贴到画布上；当文字非常大、单张纹理超过 GPU 上限时，会自动切成多块分别渲染、再逐块拼接，从而既不糊也不留接缝。',
  'A quick brown fox jumps over the lazy dog. The five boxing wizards jump quickly. Pack my box with five dozen liquor jugs.',
  '排版需要处理换行、断行、行高、字距、标点避头尾、中英文混排与基线对齐等细节；段落越长，布局计算与重排的开销越明显。',
  '因此，大段文本是检验编辑器性能的好场景：滚动、缩放、拖拽与改字时，引擎要尽量复用已有布局与纹理，避免每帧重复光栅化整篇文字。',
  '一二三四五六七八九十，百千万亿；春江潮水连海平，海上明月共潮生。滟滟随波千万里，何处春江无月明。',
  'Typography is the craft of arranging type to make written language legible, readable, and appealing when displayed.',
]

export function loadBigParagraphDemo(editor: Editor): void {
  // 拼成几千字的长文（重复段落并编号，制造足够多的行）。
  const blocks: string[] = []
  for (let i = 0; i < 48; i++) {
    blocks.push(`${i + 1}、${PARAGRAPH[i % PARAGRAPH.length]}`)
  }
  const content = blocks.join('\n')

  editor.setDoc([
    {
      id: 'big-paragraph',
      style: {
        left: 0,
        top: 0,
        width: 900,
        // 命中区域取 width×height；给一个能容下全文的高度（约 ~120 行 × 41px）。
        height: 5000,
        fontSize: 24,
        lineHeight: 1.7,
        color: '#1f2937',
      },
      text: { content },
      meta: { inCanvasIs: 'Element2D' },
    },
  ] as any)

  setTimeout(() => editor.exec('zoomToFit'), 120)
}
