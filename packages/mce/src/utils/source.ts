export interface MatchSourceOptions {
  /** 文件名扩展名匹配（针对 File）。 */
  ext?: RegExp
  /** MIME 前缀匹配（针对 Blob/File，命中任一即可）。 */
  mime?: string | string[]
}

/**
 * 生成 loader 的 `test` 谓词，统一各导入插件中重复的 `instanceof File/Blob` + 扩展名/MIME 判定。
 * - File：先按扩展名匹配，再回退 MIME 前缀；
 * - 其它 Blob：按 MIME 前缀匹配。
 */
export function matchSource(options: MatchSourceOptions): (source: any) => boolean {
  const { ext } = options
  const mimes = options.mime == null
    ? []
    : Array.isArray(options.mime)
      ? options.mime
      : [options.mime]

  const matchMime = (type: string): boolean => mimes.some(m => type.startsWith(m))

  return (source: any): boolean => {
    if (source instanceof File) {
      return (ext?.test(source.name) ?? false) || matchMime(source.type)
    }
    if (source instanceof Blob) {
      return matchMime(source.type)
    }
    return false
  }
}
