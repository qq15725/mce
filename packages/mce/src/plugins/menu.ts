import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      systemMenus: ComputedRef<any[]>
      contextMenus: ComputedRef<any[]>
    }

    type MenuKey
      = | 'edit'
        | 'undo'
        | 'redo'
        | 'cut'
        | 'copy'
        | 'paste'
        | 'duplicate'
        | 'delete'
        // ------
        | 'layer'
        | 'frame/unframe'
        | 'group/ungroup'
        | 'hide/show'
        | 'lock/unlock'
        // -----
        | 'arrange'
        | 'raiseToFront'
        | 'raise'
        | 'lower'
        | 'lowerToBack'
        // -----
        | 'flip'
        | 'flipX'
        | 'flipY'
        // -----
        | 'align'
        | 'alignLeft'
        | 'alignHorizontalCenter'
        | 'alignRight'
        | 'alignTop'
        | 'alignVerticalCenter'
        | 'alignBottom'
  }
}

export default definePlugin((editor) => {
  const {
    copiedData,
    selection,
    canUndo,
    canRedo,
    textSelection,
  } = editor

  const hasSelected = computed(() => selection.value.length > 0)

  const editMenus1 = computed(() => [
    { command: 'undo', disabled: !canUndo.value },
    { command: 'redo', disabled: !canRedo.value },
  ])

  const editMenus2 = computed(() => [
    { command: 'cut', disabled: !hasSelected.value },
    { command: 'copy', disabled: !hasSelected.value },
    { command: 'paste', disabled: !copiedData.value },
    { type: 'divider' },
    { command: 'duplicate', disabled: !hasSelected.value },
    { command: 'delete', disabled: !hasSelected.value },
  ])

  const editMenus = computed(() => [
    {
      key: 'edit',
      children: [
        ...editMenus1.value,
        { type: 'divider' },
        ...editMenus2.value,
      ],
    },
  ])

  const layerMenus1 = computed(() => [
    { command: 'frame/unframe', disabled: !hasSelected.value },
    { command: 'group/ungroup', disabled: !hasSelected.value },
    { type: 'divider' },
    { command: 'hide/show', disabled: !hasSelected.value },
    { command: 'lock/unlock', disabled: !hasSelected.value },
  ])

  const layerMenus2 = computed(() => [
    {
      key: 'arrange',
      children: [
        { command: 'raiseToFront' },
        { command: 'raise' },
        { command: 'lower' },
        { command: 'lowerToBack' },
      ],
    },
    {
      key: 'flip',
      children: [
        { command: 'flipX' },
        { command: 'flipY' },
      ],
    },
    {
      key: 'align',
      children: [
        { command: 'alignLeft' },
        { command: 'alignHorizontalCenter' },
        { command: 'alignRight' },
        { type: 'divider' },
        { command: 'alignTop' },
        { command: 'alignVerticalCenter' },
        { command: 'alignBottom' },
      ],
    },
  ])

  const layerMenus = computed(() => [
    {
      key: 'layer',
      children: [
        ...layerMenus1.value,
        { type: 'divider' },
        ...layerMenus2.value,
      ],
    },
  ])

  const selectMenus = computed(() => [
    {
      key: 'select',
      children: [
        { command: 'selectAll' },
        { command: 'deselectAll', disabled: !hasSelected.value },
        { command: 'selectParent', disabled: !hasSelected.value },
        { type: 'divider' },
        { command: 'previousSelection' },
        { command: 'nextSelection' },
      ],
    },
  ])

  const viewMenus = computed(() => [
    {
      key: 'view',
      children: [
        { command: 'zoomIn' },
        { command: 'zoomOut' },
        { command: 'zoomTo100' },
        { command: 'zoomToFit' },
        { command: 'zoomToSelection', disabled: !hasSelected.value },
      ],
    },
  ])

  const exportMenus = computed(() => [
    {
      key: 'export',
      children: [
        { command: 'saveAs:png' },
        { command: 'saveAs:jpeg' },
        { command: 'saveAs:webp' },
        { command: 'saveAs:svg' },
        { command: 'saveAs:gif' },
        { command: 'saveAs:mp4' },
        { command: 'saveAs:pdf' },
        { command: 'saveAs:pptx' },
        { command: 'saveAs:json' },
      ],
    },
  ])

  const fileMenus = computed(() => [
    {
      key: 'file',
      children: [
        { command: 'new' },
        { command: 'open' },
        { type: 'divider' },
        { command: 'import' },
        ...exportMenus.value,
        { type: 'divider' },
        { command: 'preferences' },
      ],
    },
  ])

  const insertMenus = computed(() => [
    {
      key: 'insert',
      children: [
        { command: 'insertText' },
      ],
    },
  ])

  const systemMenus = computed(() => [
    ...fileMenus.value,
    ...editMenus.value,
    ...insertMenus.value,
    ...layerMenus.value,
    ...selectMenus.value,
    ...viewMenus.value,
  ])

  const contextMenus = computed(() => {
    if (selection.value.length === 1) {
      if (textSelection.value) {
        return [
          ...editMenus1.value,
          { type: 'divider' },
          ...editMenus2.value,
        ]
      }
      else {
        return [
          ...editMenus1.value,
          { type: 'divider' },
          ...editMenus2.value,
          { type: 'divider' },
          ...layerMenus.value,
          { type: 'divider' },
          ...selectMenus.value,
          { type: 'divider' },
          ...viewMenus.value,
          { type: 'divider' },
          ...exportMenus.value,
        ]
      }
    }
    else if (selection.value.length > 1) {
      return [
        ...editMenus1.value,
        { type: 'divider' },
        ...editMenus2.value,
        { type: 'divider' },
        ...layerMenus1.value,
        { type: 'divider' },
        ...selectMenus.value,
        { type: 'divider' },
        ...viewMenus.value,
        { type: 'divider' },
        ...exportMenus.value,
      ]
    }
    else {
      return [
        ...editMenus1.value,
        { type: 'divider' },
        ...editMenus2.value,
        { type: 'divider' },
        ...selectMenus.value,
        { type: 'divider' },
        ...viewMenus.value,
        { type: 'divider' },
        ...insertMenus.value,
        { type: 'divider' },
        { command: 'new' },
        { command: 'open' },
        { type: 'divider' },
        { command: 'import' },
        ...exportMenus.value,
      ]
    }
  })

  Object.assign(editor, {
    systemMenus,
    contextMenus,
  })

  return {
    name: 'menu',
  }
})
