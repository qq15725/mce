import type { Component, MaybeRefOrGetter } from 'vue'
import {
  computed,
  createElementVNode,
  createVNode,
  defineComponent,
  inject,
  mergeProps,
  toValue,
} from 'vue'
import { IconsSymbol } from './icons'

export type IconValue = string | (string | [path: string, opacity: number])[] | Component

export function makeIconProps() {
  return {
    icon: {
      type: [String, Function, Object, Array],
    },
    tag: {
      type: [String, Object, Function],
      default: 'i',
    },
  }
}

export const MceSvgIcon = defineComponent({
  name: 'MceSvgIcon',
  inheritAttrs: false,
  props: makeIconProps(),
  setup(props, { attrs }) {
    return () => {
      return createVNode(props.tag, mergeProps(attrs, { style: null }), {
        default: () => [
          createElementVNode('svg', {
            'class': 'mce-icon__svg',
            'xmlns': 'http://www.w3.org/2000/svg',
            'viewBox': '0 0 24 24',
            'role': 'img',
            'aria-hidden': 'true',
          }, [
            Array.isArray(props.icon)
              ? props.icon.map(path => Array.isArray(path)
                  ? createElementVNode('path', {
                      'd': path[0],
                      'fill-opacity': path[1],
                    }, null)
                  : createElementVNode('path', {
                      d: path,
                    }, null))
              : createElementVNode('path', {
                  d: props.icon,
                }, null),
          ]),
        ],
      })
    }
  },
})

export const MceComponentIcon = defineComponent({
  name: 'MceComponentIcon',
  props: makeIconProps(),
  setup(props, { slots }) {
    return () => {
      return createVNode(props.tag, null, {
        default: () => [
          props.icon
            ? createVNode(props.icon, null, null)
            : slots.default?.(),
        ],
      })
    }
  },
})

export function useIcon(props: MaybeRefOrGetter<IconValue | undefined>) {
  const icons = inject(IconsSymbol)
  if (!icons)
    throw new Error('Missing Mce Icons provide!')

  const iconData = computed(() => {
    const iconAlias = toValue(props)
    if (!iconAlias) {
      return {
        component: MceComponentIcon,
      }
    }
    let icon = iconAlias
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
        component: MceSvgIcon,
        icon,
      }
    }
    else if (typeof icon !== 'string') {
      return {
        component: MceComponentIcon,
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
