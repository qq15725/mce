import type { InjectionKey } from 'vue'

import type { IconValue } from './icon'
import { merge } from 'lodash-es'
import { aliases, svg } from '../iconsets/mdi-svg'

export interface IconAliases {
  [name: string]: IconValue
  play: IconValue
  pause: IconValue
  gps: IconValue
  menuRight: IconValue
  mouseLeftClick: IconValue
  mouseRightClick: IconValue
  check: IconValue
}

export interface IconsOptions {
  defaultSet: string
  aliases: Partial<IconAliases>
  sets: Record<string, IconSet>
}

export const IconsSymbol = Symbol.for('mce:icons') as InjectionKey<IconsOptions>

export function createIcons(options: Partial<IconsOptions> = {}): IconsOptions {
  return merge({
    defaultSet: 'svg',
    aliases,
    sets: {
      svg,
    },
  } as IconsOptions, options)
}
