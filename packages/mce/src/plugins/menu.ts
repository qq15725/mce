import type { CheckerboardStyle } from 'modern-canvas'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import ContextMenu from '../components/ContextMenu.vue'
import { definePlugin } from '../plugin'

declare global {
  namespace Mce {
    interface MenuItem {
      key: string
      disabled?: boolean
      checked?: boolean
      children?: MenuItem[]
      handle?: (event: MouseEvent) => void
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
    pluginsComponents,
    isElement,
  } = editor

  const {
    customContextMenu,
  } = options

  const hasSelected = computed(() => selection.value.length > 0)

  const exportMenu = computed(() => ({
    key: 'export',
    children: [...exporters.values()]
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
    children: [...exporters.values()]
      .filter(v => Boolean(v.copyAs))
      .map(v => ({ key: `copyAs:${v.name}` })),
  }))

  const nodeMenu = computed(() => [
    { key: 'addSubNode' },
  ])

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

  const panelsMenu = computed(() => ({
    key: 'panels',
    children: pluginsComponents.value.panel.map((p) => {
      return { key: `panels:${p.name}`, checked: (config.value as any)[p.name] }
    }),
  }))

  function setCheckerboard(value: CheckerboardStyle) {
    if (config.value.checkerboard && config.value.checkerboardStyle === value) {
      config.value.checkerboard = false
    }
    else {
      config.value.checkerboard = true
      config.value.checkerboardStyle = value
    }
  }

  const checkerboardMenu = computed(() => ({
    key: 'view:checkerboard',
    children: [
      {
        key: 'checkerboardStyle:grid',
        checked: config.value.checkerboard && config.value.checkerboardStyle === 'grid',
        handle: () => setCheckerboard('grid'),
      },
      {
        key: 'checkerboardStyle:dot',
        checked: config.value.checkerboard && config.value.checkerboardStyle === 'dot',
        handle: () => setCheckerboard('dot'),
      },
    ],
  }))

  const viewMenu = computed(() => ({
    key: 'view',
    children: [
      checkerboardMenu.value,
      { key: 'view:pixelGrid', checked: config.value.pixelGrid },
      { key: 'view:ruler', checked: config.value.ruler },
      { key: 'view:scrollbar', checked: config.value.scrollbar },
      { key: 'view:frameOutline', checked: config.value.frameOutline },
      { type: 'divider' },
      {
        key: 'msaa',
        checked: config.value.msaa,
        handle: () => {
          config.value.msaa = !config.value.msaa
          if (config.value.msaa) {
            config.value.pixelate = false
          }
        },
      },
      {
        key: 'pixelate',
        checked: config.value.pixelate,
        handle: () => {
          config.value.pixelate = !config.value.pixelate
          if (config.value.pixelate) {
            config.value.msaa = false
          }
        },
      },
      {
        key: 'toolbelt',
        checked: config.value.toolbelt,
        handle: () => config.value.toolbelt = !config.value.toolbelt,
      },
      panelsMenu.value,
      { type: 'divider' },
      ...zoomViewMenu.value.children,
    ].filter(Boolean) as Mce.MenuItem[],
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
      else if (selection.value.filter(isElement).length > 0) {
        return [
          ...nodeMenu.value,
          { type: 'divider' },
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
      else {
        return [
          ...nodeMenu.value,
          { type: 'divider' },
          ...editMenus1.value,
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
    components: [
      { type: 'overlay', component: ContextMenu },
    ],
  }
})
