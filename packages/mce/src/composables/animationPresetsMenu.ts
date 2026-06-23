import type { ComputedRef } from 'vue'
import type { Editor } from '../editor'
import type { AnimationPreset } from '../utils/animationPresets'
import { computed } from 'vue'

const PRESET_CATEGORIES: { cat: AnimationPreset['category'], key: string }[] = [
  { cat: 'in', key: 'animGroupIn' },
  { cat: 'out', key: 'animGroupOut' },
  { cat: 'emphasis', key: 'animGroupEmphasis' },
]

/**
 * 「添加动画」预设菜单：按 进入 / 退出 / 强调 分组为子菜单。
 * 选中某预设时回调 onSelect，由调用方决定作用对象（单节点 / 多选）。
 * 供 Timeline 与 Trackhead 复用。
 */
export function useAnimationPresetsMenu(
  editor: Editor,
  onSelect: (preset: AnimationPreset) => void,
): ComputedRef<Mce.MenuItem[]> {
  return computed<Mce.MenuItem[]>(() =>
    PRESET_CATEGORIES.map(({ cat, key }) => ({
      key,
      children: editor.animationPresets.value
        .filter(p => p.category === cat)
        .map(p => ({
          key: p.id,
          handle: () => onSelect(p),
        })),
    })),
  )
}
