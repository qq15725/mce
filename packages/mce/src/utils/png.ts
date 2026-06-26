// 把 RGBA 像素直接编码为 PNG Blob，绕过 HTMLCanvas。
//
// 背景：HTMLCanvasElement 有硬性面积上限（桌面 Chrome 实测 2^28 ≈ 268M px / 16384²），
// 超过会静默产出空白图。而导出渲染（renderPixels）已能用分块(tiling)拼出更大的全尺寸 RGBA，
// 只要不再塞回 canvas，就能突破该限制导出大图（上限改由内存 / TypedArray ~2GB 决定）。
//
// 实现：用浏览器原生 CompressionStream('deflate')（RFC1950 zlib 流，正是 PNG IDAT 所需格式），
// 边逐行写入(filter=0)边读取压缩输出、每段输出包成独立 IDAT chunk（PNG 允许多个 IDAT），
// 避免一次性分配巨大中间缓冲。零第三方依赖。

/** 单边 / 面积超过该值的 PNG 走直编码绕过 canvas（取桌面 Chrome 实测的 canvas 上限）。 */
export const MAX_CANVAS_SIDE = 16384
export const MAX_CANVAS_AREA = 16384 * 16384

/** 当前环境是否支持绕过 canvas 的大图 PNG 编码（CompressionStream：Chrome80+/Safari16.4+/FF113+）。 */
export function supportsPngStream(): boolean {
  return typeof CompressionStream !== 'undefined'
}

let _crcTable: Uint32Array | undefined
function crcTable(): Uint32Array {
  if (_crcTable)
    return _crcTable
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++)
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return (_crcTable = table)
}

/** PNG chunk 的 CRC32：覆盖 4 字节类型 + 数据（即 buf[4 .. end)）。 */
function crc32(buf: Uint8Array, start: number, end: number): number {
  const table = crcTable()
  let crc = 0xFFFFFFFF
  for (let i = start; i < end; i++)
    crc = table[(crc ^ buf[i]!) & 0xFF]! ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

/** 组一个 PNG chunk：长度(4) + 类型(4) + 数据 + CRC(4)，大端。 */
function makeChunk(type: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
  const len = data.length
  const out = new Uint8Array(12 + len)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, len)
  out[4] = type.charCodeAt(0)
  out[5] = type.charCodeAt(1)
  out[6] = type.charCodeAt(2)
  out[7] = type.charCodeAt(3)
  out.set(data, 8)
  dv.setUint32(8 + len, crc32(out, 4, 8 + len))
  return out
}

/**
 * 把 width×height 的 RGBA 像素编码为 PNG Blob（8 位、color type 6）。
 * onProgress 回报逐行写入进度（0..1）。
 */
export async function rgbaToPngBlob(
  rgba: Uint8ClampedArray<ArrayBuffer> | Uint8Array<ArrayBuffer>,
  width: number,
  height: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const stride = width * 4

  // IHDR
  const ihdr = new Uint8Array(13)
  const idv = new DataView(ihdr.buffer)
  idv.setUint32(0, width)
  idv.setUint32(4, height)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // 逐行 filter=0 写入 deflate，压缩输出每段单独成 IDAT，边写边读避免背压死锁与大缓冲。
  const cs = new CompressionStream('deflate')
  const writer = cs.writable.getWriter()
  const reader = cs.readable.getReader()
  const idatChunks: Uint8Array<ArrayBuffer>[] = []
  const readAll = (async () => {
    for (;;) {
      const { done, value } = await reader.read()
      if (done)
        break
      idatChunks.push(makeChunk('IDAT', value))
    }
  })()

  const filter = new Uint8Array([0])
  for (let y = 0; y < height; y++) {
    await writer.ready
    await writer.write(filter)
    await writer.write(rgba.subarray(y * stride, y * stride + stride))
    if (onProgress && (y & 0x3FF) === 0)
      onProgress(y / height)
  }
  await writer.close()
  await readAll
  onProgress?.(1)

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  return new Blob(
    [signature, makeChunk('IHDR', ihdr), ...idatChunks, makeChunk('IEND', new Uint8Array(0))],
    { type: 'image/png' },
  )
}
