import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { definePlugin } from '../editor'

declare global {
  namespace Mce {
    interface Editor {
      systemMenus: ComputedRef<any[]>
      contextMenus: ComputedRef<any[]>
    }
  }
}

export default definePlugin((editor) => {
  const {
    provideProperties,
    copiedData,
    activeElement,
    selectedElements,
    currentElements,
    canUndo,
    canRedo,
    textSelection,
  } = editor

  const hasSelected = computed(() => currentElements.value.length > 0)

  const editMenus1 = computed(() => [
    { key: 'undo', disabled: !canUndo.value },
    { key: 'redo', disabled: !canRedo.value },
  ])

  const editMenus2 = computed(() => [
    { key: 'cut', disabled: !hasSelected.value },
    { key: 'copy', disabled: !hasSelected.value },
    { key: 'paste', disabled: !copiedData.value },
    { type: 'divider' },
    { key: 'duplicate', disabled: !hasSelected.value },
    { key: 'delete', disabled: !hasSelected.value },
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
    { key: 'group', disabled: !hasSelected.value },
    { key: 'ungroup', disabled: !hasSelected.value },
    { type: 'divider' },
    { key: 'hide/show', disabled: !hasSelected.value },
    { key: 'lock/unlock', disabled: !hasSelected.value },
  ])

  const layerMenus2 = computed(() => [
    {
      key: 'arrange',
      children: [
        { key: 'raiseToFront' },
        { key: 'raise' },
        { key: 'lower' },
        { key: 'lowerToBack' },
        { key: 'reverse' },
      ],
    },
    {
      key: 'flip',
      children: [
        { key: 'horizontal' },
        { key: 'vertical' },
      ],
    },
    {
      key: 'align',
      children: [
        { key: 'alignLeft' },
        { key: 'alignHorizontalCenter' },
        { key: 'alignRight' },
        { type: 'divider' },
        { key: 'alignTop' },
        { key: 'alignVerticalCenter' },
        { key: 'alignBottom' },
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
        { key: 'selectAll' },
        { key: 'deselectAll', disabled: !hasSelected.value },
        { key: 'selectParent', disabled: !hasSelected.value },
        { type: 'divider' },
        { key: 'previousSelection' },
        { key: 'nextSelection' },
      ],
    },
  ])

  const viewMenus = computed(() => [
    {
      key: 'view',
      children: [
        { key: 'zoomIn' },
        { key: 'zoomOut' },
        { key: 'zoomTo100' },
        { key: 'zoomToFit' },
        { key: 'zoomToSelection', disabled: !hasSelected.value },
      ],
    },
  ])

  const exportMenus = computed(() => [
    {
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
    },
  ])

  const fileMenus = computed(() => [
    {
      key: 'file',
      children: [
        { key: 'new' },
        { key: 'open' },
        { type: 'divider' },
        { key: 'import' },
        ...exportMenus.value,
        { type: 'divider' },
        { key: 'preferences' },
      ],
    },
  ])

  const insertMenus = computed(() => [
    {
      key: 'insert',
      children: [
        { key: 'insertText' },
        { key: 'insertImage' },
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
    if (activeElement.value) {
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
    else if (selectedElements.value.length) {
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
        { key: 'new' },
        { key: 'open' },
        { type: 'divider' },
        { key: 'import' },
        ...exportMenus.value,
        { type: 'divider' },
        { key: 'preferences' },
      ]
    }
  })

  provideProperties({
    systemMenus,
    contextMenus,
  })
})
