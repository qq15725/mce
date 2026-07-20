import type { ThemeTokens } from 'modern-canvas'
import { parseColor } from 'modern-idoc'

/**
 * 主题配置的归一与合并。
 *
 * 对外（`options.theme.themes`）按**主题**组织，与 Vuetify 的 `themes` 一致：
 * ```ts
 * { light: { dark: false, colors: { 'on-surface': '#333' } } }
 * ```
 * 对内（引擎 / DOM 侧）按 **token** 组织，即 modern-canvas 的 `ThemeTokens`：
 * ```ts
 * { 'on-surface': { light: '#333' } }
 * ```
 * 两者信息等价，本模块负责互转，使解析层（SceneTree / EditorLayout）无需感知外部写法。
 */

/**
 * 为指定 token 生成 `-lighten-N` / `-darken-N` 色阶，**就地展开成实体 token**。
 *
 * 必须是「预展开」而非「解析时按后缀动态算」：token 表不只喂给画布解析，还被
 * - `plugins/json.ts` 的 bakeTheme 直接查表烤色（查不到就把 `@token` 原样写进导出的 JSON）
 * - `components/EditorLayout.vue` 遍历生成 `--m-theme-*` CSS 变量（没进表就没有变量）
 * - `plugins/image.ts` / `mixins/exporter.ts` 传给图片、视频导出的渲染
 * 消费。动态算只有画布这一路生效，导出侧会拿到未解析的 token → 非法色 → 元素被填成整块纯色。
 *
 * 每级按 10% 明度（colord 的 HSL 明度）增减；与 Vuetify 的 CIELAB 口径不同，故同名色阶的
 * 具体色值不与 Vuetify 逐位一致，仅保证「浅一档 / 深一档」的语义。
 */
export function expandVariations(
  themes: Record<string, Mce.ThemeDefinition>,
  variations?: Mce.ThemeVariations | false,
): Record<string, Mce.ThemeDefinition> {
  if (!variations || !variations.colors?.length) {
    return themes
  }
  const { colors: names, lighten = 0, darken = 0 } = variations
  const out: Record<string, Mce.ThemeDefinition> = {}
  for (const [themeName, def] of Object.entries(themes ?? {})) {
    const colors = { ...def?.colors }
    for (const name of names) {
      const base = colors[name]
      if (!base) {
        continue
      }
      for (let i = 1; i <= lighten; i++) {
        colors[`${name}-lighten-${i}`] = parseColor(base).lighten(i * 0.1).toHex()
      }
      for (let i = 1; i <= darken; i++) {
        colors[`${name}-darken-${i}`] = parseColor(base).darken(i * 0.1).toHex()
      }
    }
    out[themeName] = { ...def, colors }
  }
  return out
}

/** `themes`（按主题组织）→ `ThemeTokens`（按 token 组织）。 */
export function themesToTokens(themes: Record<string, Mce.ThemeDefinition>): ThemeTokens {
  const tokens: ThemeTokens = {}
  for (const [themeName, def] of Object.entries(themes ?? {})) {
    for (const [token, color] of Object.entries(def?.colors ?? {})) {
      ;(tokens[token] ??= {})[themeName] = color
    }
  }
  return tokens
}

/** `ThemeTokens`（旧写法）→ `themes`，便于与新写法统一走同一套深合并。 */
export function tokensToThemes(tokens: ThemeTokens): Record<string, Mce.ThemeDefinition> {
  const themes: Record<string, Mce.ThemeDefinition> = {}
  for (const [token, byTheme] of Object.entries(tokens ?? {})) {
    for (const [themeName, color] of Object.entries(byTheme ?? {})) {
      ;((themes[themeName] ??= {}).colors ??= {})[token] = color
    }
  }
  return themes
}

/**
 * 按「主题 → colors」两级深合并。
 *
 * **必须深合并**：浅合并下宿主只要给出 `themes.light`，就会整个顶掉内核该主题的默认调色板，
 * 只想改一个 token 也得把十几个默认色抄一遍。
 */
export function mergeThemes(
  base: Record<string, Mce.ThemeDefinition>,
  override?: Record<string, Mce.ThemeDefinition>,
): Record<string, Mce.ThemeDefinition> {
  const out: Record<string, Mce.ThemeDefinition> = { ...base }
  for (const [name, def] of Object.entries(override ?? {})) {
    out[name] = {
      ...out[name],
      ...def,
      colors: { ...out[name]?.colors, ...def?.colors },
    }
  }
  return out
}
