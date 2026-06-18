import { Encoder } from 'modern-gif'

/**
 * 编码逻辑单独成模块，由 plugin 的导出 handle 通过 `await import('./encode')` 动态加载，
 * 使 modern-gif 与内联 worker 落到独立异步 chunk —— 注册 gif 插件时不付出体积，
 * 仅在真正导出 GIF 时才加载（与 @mce/mp4 的按需策略一致）。
 */
export function createGifEncoder(config: { width: number, height: number, workerUrl?: string }): Encoder {
  let { workerUrl } = config
  if (!workerUrl) {
    // 默认自带 modern-gif 的 worker：`new URL(..., import.meta.url)` 是打包器通用写法，
    // 构建时把 worker 作为 asset 内联进本（异步）chunk，消费方零配置即可 off-thread。
    // 解析失败时退回 undefined，modern-gif 会回退主线程编码。
    try {
      workerUrl = new URL('modern-gif/worker', import.meta.url).href
    }
    catch {
      workerUrl = undefined
    }
  }
  return new Encoder({ width: config.width, height: config.height, workerUrl })
}
