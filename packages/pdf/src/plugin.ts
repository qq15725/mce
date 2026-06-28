import type { PdfOptionMeta } from 'modern-pdf'
import { definePlugin, materializeImagePipelines } from 'mce'

declare global {
  namespace Mce {
    interface ExportOptions {
      pdf?: PdfOptionMeta
    }

    interface Exporters {
      pdf: Promise<Blob>
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const {
      to,
      fonts,
      resolveImagePipelines,
    } = editor

    return {
      name: 'mce:pdf',
      messages: {
        en: { 'saveAs:pdf': 'Save as PDF' },
        zhHans: { 'saveAs:pdf': '另存为 PDF' },
      },
      exporters: [
        {
          name: 'pdf',
          saveAs: true,
          handle: async (options) => {
            // 重依赖 modern-pdf 改为按需动态加载：插件注册保持轻量(eager)，
            // 真正的 PDF 生成代码仅在首次导出 PDF 时才加载。下游打包会拆成独立异步 chunk。
            const { Pdf } = await import('modern-pdf')

            const { pdf: pdfOptions, ...jsonOptions } = options

            const doc = await to('json', jsonOptions)

            // 物化图片处理管线：pdf 不能矢量重现黑盒管线，统一烘焙成成品图嵌入。
            await materializeImagePipelines(doc, resolveImagePipelines)

            doc.children?.reverse()

            const pdf = new Pdf({
              ...doc,
              fonts,
              meta: {
                ...doc.meta,
                ...pdfOptions,
              },
            } as any)

            return await pdf.toBlob()
          },
        },
      ],
    }
  })
}
