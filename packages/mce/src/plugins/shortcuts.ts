import { computed } from 'vue'
import ShortcutsPanel from '../components/ShortcutsPanel.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface UIConfig {
      shortcuts: ShortcutsConfig
    }

    interface ShortcutsConfig {
      visible: boolean
    }
  }
}

/**
 * 快捷键参考面板：把 editor.hotkeysData 全量列出、按类别分组、可搜索。
 * 用 `Ctrl+Shift+?`（Mac 上同为 Control）开关；显隐走 `ui.shortcuts` 配置，
 * 复用核心 `toggleUi:shortcuts` 命令。
 */
export default definePlugin((editor) => {
  const { registerConfig } = editor

  const config = registerConfig<Mce.ShortcutsConfig>('ui.shortcuts', {
    default: { visible: false },
  })

  return {
    name: 'mce:shortcuts',
    components: [
      {
        type: 'overlay',
        component: ShortcutsPanel,
        visible: computed({
          get: () => config.value.visible,
          set: val => config.value.visible = val,
        }),
      },
    ],
    hotkeys: [
      { command: 'toggleUi:shortcuts', key: 'Ctrl+Shift+/' },
    ],
    messages: {
      en: {
        'shortcuts': 'Keyboard shortcuts',
        // 右键菜单「视图」入口的标签（key 用热键命令以同时显示快捷键）。
        'toggleUi:shortcuts': 'Keyboard shortcuts',
        'shortcutsSearch': 'Search shortcuts',
        'shortcutsCatTools': 'Tools',
        'shortcutsCatView': 'View',
        'shortcutsCatEdit': 'Edit',
        'shortcutsCatSelection': 'Selection',
        'shortcutsCatArrange': 'Arrange',
        'shortcutsCatPlayback': 'Playback',
        'shortcutsCatDocument': 'Document',
        'shortcutsCatOther': 'Other',
      },
      zhHans: {
        'shortcuts': '键盘快捷键',
        'toggleUi:shortcuts': '键盘快捷键',
        'shortcutsSearch': '搜索快捷键',
        'shortcutsCatTools': '工具',
        'shortcutsCatView': '视图',
        'shortcutsCatEdit': '编辑',
        'shortcutsCatSelection': '选择',
        'shortcutsCatArrange': '排列',
        'shortcutsCatPlayback': '播放',
        'shortcutsCatDocument': '文档',
        'shortcutsCatOther': '其他',
      },
    },
  }
})
