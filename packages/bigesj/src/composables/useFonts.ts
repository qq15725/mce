import type { FontLoadedResult } from 'modern-font'
import { useEditor } from 'mce'
import { ref } from 'vue'

export type BigeFont = Record<string, any>

const bigeFonts = ref<BigeFont[]>([])

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    }
  }
  return matrix[b.length][a.length]
}

export function useFonts() {
  const {
    http,
    loadFont: baseLoadFont,
  } = useEditor()

  const fontPromises = ref(new Map<string, Promise<FontLoadedResult>>())

  async function loadBigeFonts(url: string, init = false): Promise<BigeFont[]> {
    let result = bigeFonts.value
    if (!init || !result.length) {
      result = await http.request({ url, responseType: 'json' })
        .then(res => res.data.datalist)
      bigeFonts.value = result
    }
    return result
  }

  function searchBigeFont(keyword: string, fonts: BigeFont[] = bigeFonts.value): BigeFont | undefined {
    const idIndexMap = new Map<string, number>(fonts.map((item, index) => [item.id, index]))
    const nameIndexMap = new Map<string, number>(
      fonts.flatMap((item, index) => {
        return [...item.en_name.split(','), ...item.name.split(',')].map((name) => {
          return [name, index]
        })
      }),
    )
    const fontFamilies = keyword.replace(/"/g, '').split(',')
    let index: number | undefined
    fontFamilies.forEach((fontFamily) => {
      // 1. ID全匹配查找
      index ??= idIndexMap.get(fontFamily)
      // 2. 名称全匹配查找
      index ??= nameIndexMap.get(fontFamily)
    })
    if (index === undefined) {
      let prevWeight: number | undefined
      fontFamilies.forEach((rawA) => {
        // 3. 名称模糊查找

        // 3.1 重写一些简写习惯
        let a = rawA
        if (a.endsWith(' R')) {
          a = `${a.substring(0, a.length - 2)}常规`
        }
        else if (a.endsWith(' B')) {
          a = `${a.substring(0, a.length - 2)}粗体`
        }

        // 3.3 根据字符距离查找最近
        const aLen = a.length
        nameIndexMap.forEach((i, b) => {
          const dist = levenshteinDistance(a, b)
          // 跳过需要全字符改写的情况
          if (aLen <= dist) {
            return
          }
          // 常规字体加权
          const weight = -(dist * 0.9 + (b.endsWith('常规') ? 0 : 1) * 0.1)
          // 找出权重最高的作为近似字体
          if (prevWeight === undefined || weight > prevWeight) {
            prevWeight = weight
            index = i
          }
        })
      })
    }
    return index !== undefined ? fonts[index] : undefined
  }

  async function loadFont(name: string | string[]): Promise<(FontLoadedResult | undefined)[]> {
    const names = typeof name === 'string' ? [name] : name
    const result: Promise<FontLoadedResult | undefined>[] = []
    for (const name of names) {
      let promise = fontPromises.value.get(name)
      if (!promise) {
        const font = searchBigeFont(name)
        if (font) {
          promise = fontPromises.value.get(font.en_name)
          if (!promise) {
            const names = Array.from(
              new Set(
                [name, font.en_name]
                  .filter(Boolean)
                  .map((v: any) => v.replace(/"/g, '')),
              ),
            )
            promise = baseLoadFont({
              family: names,
              src: font.fonturl,
            })
            names.forEach(name => fontPromises.value.set(name, promise!))
            fontPromises.value.set(String(name), promise)
          }
        }
      }
      promise && result.push(promise)
    }
    return await Promise.all(result)
  }

  return {
    bigeFonts,
    searchBigeFont,
    loadBigeFonts,
    loadFont,
  }
}
