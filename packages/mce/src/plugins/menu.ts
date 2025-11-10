import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface MenuItem {
      key: string
      disabled?: boolean
      checked?: boolean
      children: MenuItem[]
    }

    interface Editor {
      mainMenu: ComputedRef<MenuItem[]>
      contextMenu: ComputedRef<MenuItem[]>
    }

    interface Options {
      customContextMenu?: (
        defaultMenu: MenuItem[],
        editor: Editor,
      ) => MenuItem[]
    }
  }
}

export default definePlugin((editor, options) => {
  const {
    canUndo,
    canRedo,
    selection,
    textSelection,
    config,
    exporters,
  } = editor

  const {
    customContextMenu,
  } = options

  const hasSelected = computed(() => selection.value.length > 0)

  const exportMenu = computed(() => ({
    key: 'export',
    children: [...exporters.value.values()]
      .filter(v => Boolean(v.saveAs))
      .map(v => ({ key: `saveAs:${v.name}` })),
  }))

  const fileMenu = computed(() => ({
    key: 'file',
    children: [
      { key: 'new' },
      { key: 'open' },
      { type: 'divider' },
      { key: 'import' },
      exportMenu.value.children.length && exportMenu.value,
    ].filter(Boolean),
  }))

  const historyMenus = computed(() => [
    { key: 'undo', disabled: !canUndo.value },
    { key: 'redo', disabled: !canRedo.value },
  ])

  const copyAsMenu = computed(() => ({
    key: 'copyAs',
    disabled: !hasSelected.value,
    children: [...exporters.value.values()]
      .filter(v => Boolean(v.copyAs))
      .map(v => ({ key: `copyAs:${v.name}` })),
  }))

  const editMenus1 = computed(() => [
    { key: 'copy', disabled: !hasSelected.value },
    copyAsMenu.value.children.length && copyAsMenu.value,
    { key: 'cut', disabled: !hasSelected.value },
    { key: 'paste' },
    { key: 'duplicate', disabled: !hasSelected.value },
    { key: 'delete', disabled: !hasSelected.value },
  ].filter(Boolean))

  const selectMenu = computed(() => ({
    key: 'select',
    children: [
      { key: 'selectAll' },
      { key: 'deselectAll', disabled: !hasSelected.value },
      { key: 'selectParent', disabled: !hasSelected.value },
      { key: 'previousSelection', disabled: !hasSelected.value },
      { key: 'nextSelection', disabled: !hasSelected.value },
    ],
  }))

  const editMenu = computed(() => ({
    key: 'edit',
    children: [
      ...historyMenus.value,
      { type: 'divider' },
      ...editMenus1.value,
      { type: 'divider' },
      ...selectMenu.value.children,
    ],
  }))

  const zoomViewMenu = computed(() => ({
    key: 'view',
    children: [
      { key: 'zoomIn' },
      { key: 'zoomOut' },
      { key: 'zoomTo100' },
      { key: 'zoomToFit' },
      { key: 'zoomToSelection', disabled: !hasSelected.value },
    ],
  }))

  const viewMenu = computed(() => ({
    key: 'view',
    children: [
      { key: 'view:checkerboard', checked: config.value.checkerboard },
      { key: 'view:pixelGrid', checked: config.value.pixelGrid },
      { key: 'view:ruler', checked: config.value.ruler },
      { key: 'view:scrollbar', checked: config.value.scrollbar },
      { key: 'view:layers', checked: config.value.layers },
      { key: 'view:timeline', checked: config.value.timeline },
      { key: 'view:statusbar', checked: config.value.statusbar },
      { key: 'view:frameOutline', checked: config.value.frameOutline },
      { type: 'divider' },
      ...zoomViewMenu.value.children,
    ],
  }))

  const objectMenu1 = computed(() => [
    { key: 'groupSelection', disabled: !hasSelected.value },
    { key: 'frameSelection', disabled: !hasSelected.value },
    { key: 'ungroup', disabled: !(
      hasSelected.value
      && selection.value[0]?.children.length
    ) },
  ])

  const layerOrderMenu = computed(() => ({
    key: 'layerOrder',
    children: [
      { key: 'bringToFront', disabled: !hasSelected.value },
      { key: 'bringForward', disabled: !hasSelected.value },
      { key: 'sendBackward', disabled: !hasSelected.value },
      { key: 'sendToBack', disabled: !hasSelected.value },
    ],
  }))

  const flipMenu = computed(() => ({
    key: 'flip',
    children: [
      { key: 'flipHorizontal', disabled: !hasSelected.value },
      { key: 'flipVertical', disabled: !hasSelected.value },
    ],
  }))

  const objectMenu2 = computed(() => [
    { key: 'hide/show', disabled: !hasSelected.value },
    { key: 'lock/unlock', disabled: !hasSelected.value },
  ])

  const objectMenu = computed(() => ({
    key: 'object',
    children: [
      ...objectMenu1.value,
      { type: 'divider' },
      ...layerOrderMenu.value.children,
      { type: 'divider' },
      ...flipMenu.value.children,
      { type: 'divider' },
      ...objectMenu2.value,
    ],
  }))

  const alignMenus = computed(() => [
    { key: 'alignLeft', disabled: !hasSelected.value },
    { key: 'alignHorizontalCenter', disabled: !hasSelected.value },
    { key: 'alignRight', disabled: !hasSelected.value },
    { key: 'alignTop', disabled: !hasSelected.value },
    { key: 'alignVerticalCenter', disabled: !hasSelected.value },
    { key: 'alignBottom', disabled: !hasSelected.value },
  ])

  const layerPositionMenu = computed(() => ({
    key: 'layerPosition',
    children: [
      ...alignMenus.value,
    ],
  }))

  const mainMenu = computed(() => [
    fileMenu.value,
    editMenu.value,
    viewMenu.value,
    objectMenu.value,
    layerPositionMenu.value,
  ])

  const _contextMenu = computed(() => {
    if (selection.value.length > 0) {
      if (textSelection.value) {
        return [
          ...editMenus1.value,
        ]
      }
      else {
        return [
          ...editMenus1.value,
          { type: 'divider' },
          ...objectMenu1.value,
          ...objectMenu2.value,
          { type: 'divider' },
          layerOrderMenu.value,
          layerPositionMenu.value,
          flipMenu.value,
          zoomViewMenu.value,
          { type: 'divider' },
          exportMenu.value,
        ]
      }
    }
    else {
      return [
        { key: 'paste' },
        { type: 'divider' },
        ...mainMenu.value,
        { type: 'divider' },
        exportMenu.value,
      ]
    }
  })

  const contextMenu = computed(() => {
    const menu = _contextMenu.value as Mce.MenuItem[]
    return customContextMenu?.(menu, editor) ?? menu
  })

  Object.assign(editor, {
    mainMenu,
    contextMenu,
  })

  return {
    name: 'mce:menu',
  }
})
