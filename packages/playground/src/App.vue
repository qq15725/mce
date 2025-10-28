<script setup lang="ts">
import bigesj from '@mce/bigesj'
import gaoding from '@mce/gaoding'
import { Editor, EditorTemplate, LayoutItem } from 'mce'
import gifWorkerUrl from 'modern-gif/worker?url'
import 'mce/styles'

const editor = new Editor({
  plugins: [
    bigesj,
    gaoding,
  ],
  theme: 'system',
  language: 'en',
  viewMode: 'edgeless',
  checkerboard: true,
  pixelGrid: true,
  camera: true,
  ruler: true,
  scrollbar: true,
  timeline: true,
  statusbar: true,
  wheelZoom: false,
  frameOutline: true,
  frameGap: 48,
  typographyStrategy: 'autoHeight',
  handleShape: 'rect',
  zoomToFitOffset: { left: 50, top: 50, right: 50, bottom: 50 },
  defaultFont: { family: 'SourceHanSansCN-Normal', src: '/SourceHanSansCN-Normal.woff' },
  localDb: false,
  gifWorkerUrl,
  locale: {
    locale: 'zh-Hans',
    messages: {
      'zh-Hans': {
        'cancel': '取消',
        'constrainToAxis': '约束到轴',
        'loading': '加载中...',
        'selecting': '选择中...',
        'selectObject': '选择对象',
        'commitChanges': '提交修改',
        'extend': '扩展',
        'goBackSelectedArea': '返回选中区域',
        'selectArea': '选择区域',
        'dragSelected': '拖拽选择的',
        'file': '文件',
        'new': '新建',
        'open': '打开',
        'preferences': '设置',
        'import': '导入',
        'export': '导出',
        'saveAs:png': '另存为 PNG',
        'saveAs:jpeg': '另存为 JPEG',
        'saveAs:webp': '另存为 WEBP',
        'saveAs:svg': '另存为 SVG',
        'saveAs:gif': '另存为 GIF',
        'saveAs:mp4': '另存为 MP4',
        'saveAs:pdf': '另存为 PDF',
        'saveAs:pptx': '另存为 PPTX',
        'saveAs:json': '另存为 JSON',
        'edit': '编辑',
        'undo': '撤销',
        'redo': '重做',
        'cut': '剪切',
        'copy': '复制',
        'paste': '粘贴',
        'duplicate': '创建副本',
        'delete': '删除',
        'selectAll': '选择全部',
        'deselectAll': '反选全部',
        'selectParent': '选择父元素',
        'previousSelection': '选择前一个',
        'nextSelection': '选择后一个',
        'view': '视图',
        'view:checkerboard': '棋盘',
        'view:pixelGrid': '像素网格',
        'view:ruler': '标尺',
        'view:scrollbar': '滚动条',
        'view:timeline': '时间线',
        'view:statusbar': '状态栏',
        'view:frameOutline': '框轮廓',
        'zoom': '缩放',
        'zoomIn': '放大',
        'zoomOut': '缩小',
        'zoomTo100': '缩放到100%',
        'zoomToFit': '缩放到合适',
        'zoomToSelection': '缩放到选区',
        'object': '对象',
        'frame/unframe': '框/解框',
        'group/ungroup': '组/解组',
        'flip': '翻转',
        'flipHorizontal': '水平翻转',
        'flipVertical': '垂直翻转',
        'hide/show': '隐藏/显示',
        'lock/unlock': '锁/解锁',
        'layerOrder': '图层顺序',
        'bringToFront': '移到顶层',
        'bringForward': '上移一层',
        'sendBackward': '下移一层',
        'sendToBack': '移到底层',
        'layerPosition': '图层位置',
        'alignLeft': '贴左侧',
        'alignHorizontalCenter': '水平居中',
        'alignRight': '贴右侧',
        'alignTop': '贴顶部',
        'alignVerticalCenter': '垂直居中',
        'alignBottom': '贴底部',
      },
    },
  },
})

// editor.on('setDoc', () => {
//   editor.load('http://localhost:5173/example.jpg').then((el) => {
//     editor.addElement(el, {
//       position: { x: 500, y: 100 },
//     })
//   })
// })

editor.on('ready', () => {
  console.log('ready')
})

window.editor = editor
window.doc = editor.doc
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <EditorTemplate :editor="editor">
      <template #selector="{ box }" />
      <template #transformer="{ box }" />
      <template #floatbar />
      <template #drawboard />

      <LayoutItem
        :model-value="true"
        position="top"
        :size="56"
      />

      <LayoutItem
        :model-value="true"
        position="left"
        :size="380"
      />

      <LayoutItem
        :model-value="true"
        position="right"
        :size="260"
      />
    </EditorTemplate>
  </div>
</template>
