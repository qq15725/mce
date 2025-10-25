import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      mainMenu: ComputedRef<any[]>
      contextMenu: ComputedRef<any[]>
    }
  }
}

export default definePlugin((editor) => {
  const {
    canUndo,
    canRedo,
    copiedData,
    selection,
    textSelection,
    config,
  } = editor

  const hasSelected = computed(() => selection.value.length > 0)

  const exportMenu = computed(() => ({
    key: 'export',
    children: [
      { key: 'saveAs:png' },
      { key: 'saveAs:jpeg' },
      { key: 'saveAs:webp' },
      { key: 'saveAs:svg' },
      { key: 'saveAs:gif' },
      { key: 'saveAs:mp4' },
      { key: 'saveAs:pdf' },
      { key: 'saveAs:pptx' },
      { key: 'saveAs:json' },
    ],
  }))

  const fileMenu = computed(() => ({
    key: 'file',
    children: [
      { key: 'new' },
      { key: 'open' },
      { type: 'divider' },
      { key: 'import' },
      exportMenu.value,
      { type: 'divider' },
      { key: 'preferences' },
    ],
  }))

  const historyMenus = computed(() => [
    { key: 'undo', disabled: !canUndo.value },
    { key: 'redo', disabled: !canRedo.value },
  ])

  const editMenus1 = computed(() => [
    { key: 'copy', disabled: !hasSelected.value },
    { key: 'cut', disabled: !hasSelected.value },
    { key: 'paste', disabled: !copiedData.value },
    { key: 'duplicate', disabled: !hasSelected.value },
    { key: 'delete', disabled: !hasSelected.value },
  ])

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

  const zoomMenu = computed(() => ({
    key: 'zoom',
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
      { key: 'ruler', checked: config.value.ruler },
      { key: 'scrollbar', checked: config.value.scrollbar },
      { key: 'timeline', checked: config.value.timeline },
      { key: 'statusbar', checked: config.value.statusbar },
      { type: 'divider' },
      ...zoomMenu.value.children,
    ],
  }))

  const objectMenu1 = computed(() => [
    { key: 'group/ungroup', disabled: !hasSelected.value },
    { key: 'frame/unframe', disabled: !hasSelected.value },
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

  const contextMenu = computed(() => {
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
          { type: 'divider' },
          exportMenu.value,
        ]
      }
    }
    else {
      return [
        editMenus1.value[2],
        { type: 'divider' },
        ...mainMenu.value,
        { type: 'divider' },
        exportMenu.value,
      ]
    }
  })

  Object.assign(editor, {
    mainMenu,
    contextMenu,
  })

  return {
    name: 'menu',
  }
})
