import type { Component, MaybeRefOrGetter } from 'vue'
import { computed, inject, toValue } from 'vue'
import { ComponentIcon, SvgIcon } from '../components/icon'
import { logger } from '../utils/console'
import { IconsSymbol } from './icons'

/** 单条描边/填充路径的显式属性（用于连线类图标，fill 默认 none）。 */
export interface IconPathSpec {
  d: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeLinecap?: 'butt' | 'round' | 'square'
  strokeLinejoin?: 'miter' | 'round' | 'bevel'
}

export type IconValue = string | (string | [path: string, opacity: number] | IconPathSpec)[] | Component

/**
 * 描边（outline）图标辅助：把若干 SVG path 的 `d` 按 Lucide 默认样式
 * （fill none / stroke currentColor / 线宽 2 / 圆头圆角）成组，得到一个描边风格图标。
 * 供核心图标集与插件（registerIcon）复用现成的 outline 图标（如 https://icones.js.org 的 Lucide）。
 */
export function outlineIcon(...ds: string[]): IconPathSpec[] {
  return ds.map(d => ({
    d,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }))
}

export function useIcon(props: MaybeRefOrGetter<IconValue | undefined>) {
  const icons = inject(IconsSymbol)
  if (!icons)
    throw new Error('Missing Mce Icons provide!')

  const iconData = computed(() => {
    const iconAlias = toValue(props)
    if (!iconAlias) {
      return {
        component: ComponentIcon,
      }
    }
    let icon: any = iconAlias
    if (typeof icon === 'string') {
      icon = icon.trim()
      if (icon.startsWith('$')) {
        icon = icons.aliases?.[icon.slice(1)]
      }
    }
    if (!icon)
      logger.warn(`Could not find aliased icon "${iconAlias}"`)
    if (Array.isArray(icon)) {
      return {
        component: SvgIcon,
        icon,
      }
    }
    else if (typeof icon !== 'string') {
      return {
        component: ComponentIcon,
        icon,
      }
    }
    const iconSetName = Object.keys(icons.sets).find(setName => typeof icon === 'string' && icon.startsWith(`${setName}:`))
    const iconName = iconSetName ? icon.slice(iconSetName.length + 1) : icon
    const iconSet = icons.sets[iconSetName ?? icons.defaultSet]
    return {
      component: iconSet.component,
      icon: iconName,
    }
  })

  return {
    iconData,
  }
}
