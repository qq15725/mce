import type { Component, MaybeRefOrGetter } from 'vue'
import { computed, inject, toValue } from 'vue'
import { ComponentIcon, SvgIcon } from '../components/icon'
import { IconsSymbol } from './icons'

export type IconValue = string | (string | [path: string, opacity: number])[] | Component

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
      console.warn(`Could not find aliased icon "${iconAlias}"`)
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
