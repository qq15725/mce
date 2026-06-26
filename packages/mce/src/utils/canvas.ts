// 浏览器 2D canvas 的最大可用正方形边长（受面积上限约束，各浏览器/设备不同，非定值——
// 桌面 Chrome 约 16384 / 面积 2^28，Safari/移动端更低）。走 canvas.toBlob 的导出（jpeg / webp /
// 不支持 CompressionStream 时的 png）超过它会「静默产出空白图」，故需据此预先钳制输出尺寸。
// 运行时降序探测一次实测的最大边长并缓存，而非写死。

let _maxCanvasSide = 0

export function getMaxCanvasSide(): number {
  if (_maxCanvasSide)
    return _maxCanvasSide
  let side = 4096 // 探测失败时的保守兜底
  if (typeof document !== 'undefined') {
    const works = (n: number): boolean => {
      try {
        const c = document.createElement('canvas')
        c.width = n
        c.height = n
        const ctx = c.getContext('2d')
        if (!ctx)
          return false
        ctx.fillStyle = '#fff'
        ctx.fillRect(n - 1, n - 1, 1, 1)
        // 超过 canvas 面积上限时角落像素画不上去（读回 alpha=0）
        return ctx.getImageData(n - 1, n - 1, 1, 1).data[3] === 255
      }
      catch {
        return false
      }
    }
    // 降序取第一个可用值（即实测最大方形边长），命中即停，避免多次大分配
    for (const n of [16384, 14000, 12000, 10000, 8192, 6000, 4096]) {
      if (works(n)) {
        side = n
        break
      }
    }
  }
  return (_maxCanvasSide = side)
}
