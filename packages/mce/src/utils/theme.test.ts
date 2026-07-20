import { describe, expect, it } from 'vitest'
import { expandVariations, mergeThemes, themesToTokens, tokensToThemes } from './theme'

// 主题配置对外按「主题」组织（Vuetify 式）、对内按「token」组织（modern-canvas 的 ThemeTokens）。
// 这里锁住两种形态的互转与深合并语义——解析层（SceneTree / EditorLayout）只认后者，转换错了
// 会直接表现为画布上的 `@token` 解析不到（元素变默认色 / 整块纯色）。

describe('themesToTokens', () => {
  it('把「主题 → colors」转成「token → 主题」', () => {
    expect(themesToTokens({
      light: { dark: false, colors: { 'surface': '#fff', 'on-surface': '#333' } },
      dark: { dark: true, colors: { 'surface': '#171717', 'on-surface': '#e5e7eb' } },
    })).toEqual({
      'surface': { light: '#fff', dark: '#171717' },
      'on-surface': { light: '#333', dark: '#e5e7eb' },
    })
  })

  it('只在某个主题下定义的 token 也保留（另一主题缺省即解析不到、回退原值）', () => {
    expect(themesToTokens({
      light: { colors: { accent: '#f00' } },
      dark: { colors: {} },
    })).toEqual({ accent: { light: '#f00' } })
  })

  it('空配置 / 无 colors 不炸', () => {
    expect(themesToTokens({})).toEqual({})
    expect(themesToTokens({ light: {} })).toEqual({})
  })

  it('支持任意主题名，不限 light/dark', () => {
    expect(themesToTokens({ sepia: { colors: { surface: '#f4ecd8' } } }))
      .toEqual({ surface: { sepia: '#f4ecd8' } })
  })
})

describe('tokensToThemes', () => {
  it('旧写法（按 token 组织）转回按主题组织', () => {
    expect(tokensToThemes({
      'surface': { light: '#fff', dark: '#171717' },
      'on-surface': { light: '#333' },
    })).toEqual({
      light: { colors: { 'surface': '#fff', 'on-surface': '#333' } },
      dark: { colors: { surface: '#171717' } },
    })
  })

  it('与 themesToTokens 互为逆运算（颜色信息无损）', () => {
    const tokens = {
      'surface': { light: '#fff', dark: '#171717' },
      'on-surface': { light: '#333', dark: '#e5e7eb' },
    }
    expect(themesToTokens(tokensToThemes(tokens))).toEqual(tokens)
  })

  it('空输入不炸', () => {
    expect(tokensToThemes({})).toEqual({})
  })
})

describe('mergeThemes', () => {
  const base = {
    light: { dark: false, colors: { 'surface': '#fff', 'on-surface': '#333', 'primary': '#4597f8' } },
    dark: { dark: true, colors: { surface: '#171717' } },
  }

  it('只覆盖给出的 token，同主题其余默认色保留（深合并的关键）', () => {
    const out = mergeThemes(base, { light: { colors: { primary: '#ff6644' } } })
    expect(out.light!.colors).toEqual({
      'surface': '#fff', // 未提及 → 保留
      'on-surface': '#333', // 未提及 → 保留
      'primary': '#ff6644', // 覆盖生效
    })
  })

  it('未提及的主题原样保留', () => {
    const out = mergeThemes(base, { light: { colors: { primary: '#ff6644' } } })
    expect(out.dark).toEqual(base.dark)
  })

  it('可新增主题', () => {
    const out = mergeThemes(base, { sepia: { colors: { surface: '#f4ecd8' } } })
    expect(Object.keys(out).sort()).toEqual(['dark', 'light', 'sepia'])
  })

  it('可只改 dark 标记而不动 colors', () => {
    const out = mergeThemes(base, { light: { dark: true } })
    expect(out.light!.dark).toBe(true)
    expect(out.light!.colors).toEqual(base.light.colors)
  })

  it('override 为空时等价于 base', () => {
    expect(mergeThemes(base, undefined)).toEqual(base)
    expect(mergeThemes(base, {})).toEqual(base)
  })

  it('不改动入参（无副作用）', () => {
    const snapshot = JSON.parse(JSON.stringify(base))
    mergeThemes(base, { light: { colors: { primary: '#000' } } })
    expect(base).toEqual(snapshot)
  })
})

describe('新旧写法混用（options.theme.themes ⊕ options.themeTokens）', () => {
  it('归一后一并深合并，同 token 以旧写法为准', () => {
    const defaults = { light: { colors: { 'surface': '#fff', 'on-surface': '#333' } } }
    // 新写法改 surface，旧写法改 on-surface + 再次改 surface
    const merged = mergeThemes(
      mergeThemes(defaults, { light: { colors: { surface: '#eee' } } }),
      tokensToThemes({ 'on-surface': { light: '#000' }, 'surface': { light: '#ccc' } }),
    )
    expect(merged.light!.colors).toEqual({
      'surface': '#ccc', // 旧写法后合并 → 胜出
      'on-surface': '#000',
    })
    // 最终交给引擎的形态
    expect(themesToTokens(merged)).toEqual({
      'surface': { light: '#ccc' },
      'on-surface': { light: '#000' },
    })
  })
})

describe('expandVariations', () => {
  const themes = {
    light: { colors: { 'primary': '#4597f8', 'on-surface': '#333333' } },
    dark: { colors: { 'primary': '#4597f8', 'on-surface': '#e5e7eb' } },
  }

  it('默认不生成（不传 / false / 空 colors 均原样返回）', () => {
    expect(expandVariations(themes)).toBe(themes)
    expect(expandVariations(themes, false)).toBe(themes)
    expect(expandVariations(themes, { colors: [], lighten: 3 })).toBe(themes)
  })

  it('按档数生成 -lighten-N / -darken-N，且只对列出的 token', () => {
    const out = expandVariations(themes, { colors: ['primary'], lighten: 2, darken: 1 })
    expect(Object.keys(out.light!.colors!).sort()).toEqual([
      'on-surface',
      'primary',
      'primary-darken-1',
      'primary-lighten-1',
      'primary-lighten-2',
    ])
    // 变浅一档应比基色亮、变深一档应比基色暗
    expect(out.light!.colors!['primary-lighten-1']).not.toBe('#4597f8')
    expect(out.light!.colors!['primary-darken-1']).not.toBe('#4597f8')
  })

  it('每个主题各按自己的基色算（同名 token 不同主题结果不同）', () => {
    const out = expandVariations(themes, { colors: ['on-surface'], lighten: 1 })
    expect(out.light!.colors!['on-surface-lighten-1'])
      .not
      .toBe(out.dark!.colors!['on-surface-lighten-1'])
  })

  it('基色不存在的 token 跳过，不产出空值', () => {
    const out = expandVariations(themes, { colors: ['nope'], lighten: 2 })
    expect(Object.keys(out.light!.colors!)).toEqual(['primary', 'on-surface'])
  })

  it('保留 dark 标记等非 colors 字段', () => {
    const out = expandVariations({ light: { dark: false, colors: { primary: '#4597f8' } } }, { colors: ['primary'], lighten: 1 })
    expect(out.light!.dark).toBe(false)
  })

  it('不改动入参（无副作用）', () => {
    const snapshot = JSON.parse(JSON.stringify(themes))
    expandVariations(themes, { colors: ['primary'], lighten: 3, darken: 3 })
    expect(themes).toEqual(snapshot)
  })

  it('生成的色阶会进 token 表 —— 导出侧（json bakeTheme / CSS 变量）据此查表', () => {
    const tokens = themesToTokens(expandVariations(themes, { colors: ['primary'], lighten: 1 }))
    expect(tokens['primary-lighten-1']).toBeDefined()
    expect(Object.keys(tokens['primary-lighten-1']!).sort()).toEqual(['dark', 'light'])
  })

  it('在合并之后展开：宿主覆盖过的基色按新值生成色阶', () => {
    const merged = mergeThemes(themes, { light: { colors: { primary: '#ff6644' } } })
    const out = expandVariations(merged, { colors: ['primary'], lighten: 1 })
    const fromOverridden = expandVariations(
      { light: { colors: { primary: '#ff6644' } } },
      { colors: ['primary'], lighten: 1 },
    ).light!.colors!['primary-lighten-1']
    expect(out.light!.colors!['primary-lighten-1']).toBe(fromOverridden)
  })
})
