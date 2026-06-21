<script setup lang="ts">
import ai from '@mce/ai'
import bigesj, { options } from '@mce/bigesj'
import chart from '@mce/chart'
import collaboration from '@mce/collaboration'
import comments from '@mce/comments'
import gaoding from '@mce/gaoding'
import html from '@mce/html'
import gif from '@mce/gif'
import mp4 from '@mce/mp4'
import openxml from '@mce/openxml'
import pdf from '@mce/pdf'
import psd from '@mce/psd'
import svg from '@mce/svg'
import table from '@mce/table'
import workflow from '@mce/workflow'
import { Editor, EditorLayers, EditorLayout, EditorLayoutItem } from 'mce'
import { computed } from 'vue'
import { BroadcastChannelProvider } from './collab'
import { loadAnimationDemo, loadChartDemo, loadCommentsDemo, loadConnectionDemo, loadFillStrokeDemo, loadGifDemo, loadImageEffectsDemo, loadInteractionDemo, loadLayoutDemo, loadShapesDemo, loadSmartGuidesDemo, loadTableDemo, loadTextDemo, loadVideoDemo } from './demos'
import 'mce/styles'

const editorOptions = {
  ...options,
  viewport: {
    ...options.viewport,
    screenPadding: { left: 100, top: 100, right: 100, bottom: 100 },
  },
  canvas: {
    ...options.canvas,
    watermark: {
      url: '/example.jpg',
      width: 100,
      alpha: 0.05,
      rotation: 0.5236,
    },
  },
  ui: {
    ...options.ui,
    toolbelt: { visible: true },
    timeline: { visible: true },
  },
}

const editor = new Editor({
  ...editorOptions,
  debug: true,
  plugins: [
    bigesj({ font: true }),
    gaoding(),
    openxml(),
    pdf(),
    svg(),
    mp4(),
    gif(),
    psd(),
    chart(),
    table(),
    ai(),
    html(),
    workflow(),
    collaboration(),
    comments(),
  ],
})

window.editor = editor
window.doc = editor.doc

const searchParams = new URL(window.location.href).searchParams
const tid = searchParams.get('tid')
const bid = searchParams.get('bid')
const url = searchParams.get('url')
const demo = searchParams.get('demo')
if (tid || bid) {
  editor.loadDoc({ tid, bid })
}
else if (url) {
  editor.loadDoc(url)
}
else if (demo === 'connection') {
  loadConnectionDemo(editor)
}
else if (demo === 'layout') {
  loadLayoutDemo(editor)
}
else if (demo === 'animation') {
  loadAnimationDemo(editor)
}
else if (demo === 'interaction') {
  loadInteractionDemo(editor)
}
else if (demo === 'gif') {
  loadGifDemo(editor)
}
else if (demo === 'video') {
  loadVideoDemo(editor)
}
else if (demo === 'smartGuides') {
  loadSmartGuidesDemo(editor)
}
else if (demo === 'imageEffects') {
  loadImageEffectsDemo(editor)
}
else if (demo === 'shapes') {
  loadShapesDemo(editor)
}
else if (demo === 'text') {
  loadTextDemo(editor)
}
else if (demo === 'fillStroke') {
  loadFillStrokeDemo(editor)
}
else if (demo === 'table') {
  loadTableDemo(editor)
}
else if (demo === 'chart') {
  loadChartDemo(editor)
}
else if (demo === 'comments') {
  loadCommentsDemo(editor)
}

// 协同演示：用 BroadcastChannel 在同浏览器多标签间同步（零服务端）。
// 既可带 ?room=xxx 自动加入，也可点 demobar 上的「开启协同 / 新标签加入」按钮。
function currentRoom(): string {
  return new URL(window.location.href).searchParams.get('room')
    || `room-${Math.floor(Math.random() * 100000)}`
}

function connectRoom(room: string): void {
  // 同步到 URL，方便复制链接 / 开新标签携带同一房间。
  const u = new URL(window.location.href)
  u.searchParams.set('room', room)
  window.history.replaceState(null, '', u)
  editor.collaboration.connect({
    provider: doc => new BroadcastChannelProvider(doc, room),
  })
  editor.presence.setUser({ name: `User-${Math.floor(Math.random() * 1000)}` })
}

function toggleCollab(): void {
  if (editor.collaboration.active.value) {
    editor.collaboration.disconnect()
  }
  else {
    connectRoom(currentRoom())
  }
}

// 开一个新标签页加入同一房间（先确保当前标签已入会，新标签不带 demo、纯接收同步）。
function openCollabTab(): void {
  const room = currentRoom()
  if (!editor.collaboration.active.value) {
    connectRoom(room)
  }
  const u = new URL(window.location.href)
  u.searchParams.set('room', room)
  u.searchParams.delete('demo')
  window.open(u.toString(), '_blank')
}

const room = searchParams.get('room')
if (room) {
  connectRoom(room)
}

const element = computed(() => editor.elementSelection.value[0])
</script>

<template>
  <div style="width: 100vw; height: 100vh">
    <EditorLayout :editor="editor">
      <template #selection />
      <template #selection.transform />

      <template #selection.foreground-cropper="{ scale, setScale, setAspectRatio, ok, cancel }">
        <div class="bar cropbar">
          <button @click="() => setAspectRatio(0)">
            原图大小
          </button>
          <button @click="() => setAspectRatio([3, 4])">
            3:4
          </button>
          <button @click="() => setAspectRatio([16, 9])">
            16:9
          </button>
          <input :value="scale" type="number" style="width: 64px" @change="setScale(($event.target as any).value)">
          <button @click="cancel">
            取消
          </button>
          <button @click="ok">
            确定
          </button>
        </div>
      </template>

      <template #floatbar-top>
        <div class="bar floatbar">
          <template v-if="element?.foreground.isValid()">
            <button @click="() => editor.state.value = editor.state.value === 'cropping' ? undefined : 'cropping'">
              裁剪
            </button>
            <button @click="() => element!.meta.lockAspectRatio = !element!.meta.lockAspectRatio">
              {{ element!.meta.lockAspectRatio ? '解锁' : '锁定' }}宽高比
            </button>
          </template>
          <span v-else>FLOATBAR-TOP</span>
        </div>
      </template>

      <template #drawboard>
        <div class="bar demobar">
          <button
            :style="{ color: editor.collaboration.active.value ? '#0CA678' : undefined, fontWeight: 'bold' }"
            @click="toggleCollab"
          >
            {{ editor.collaboration.active.value ? '断开协同' : '开启协同' }}
          </button>
          <button :style="{ fontWeight: 'bold' }" @click="openCollabTab">
            新标签加入
          </button>
          <span style="width: 1px; align-self: stretch; background: rgba(0,0,0,.15)" />
          <button @click="() => loadConnectionDemo(editor)">
            连线示例
          </button>
          <button @click="() => loadLayoutDemo(editor)">
            布局示例
          </button>
          <button @click="() => loadAnimationDemo(editor)">
            动画示例
          </button>
          <button @click="() => loadInteractionDemo(editor)">
            交互示例
          </button>
          <button @click="() => loadGifDemo(editor)">
            GIF 示例
          </button>
          <button @click="() => loadVideoDemo(editor)">
            视频示例
          </button>
          <button @click="() => loadSmartGuidesDemo(editor)">
            参考线示例
          </button>
          <button @click="() => loadImageEffectsDemo(editor)">
            图片样式示例
          </button>
          <button @click="() => loadShapesDemo(editor)">
            形状示例
          </button>
          <button @click="() => loadTextDemo(editor)">
            文字示例
          </button>
          <button @click="() => loadFillStrokeDemo(editor)">
            填充描边示例
          </button>
          <button @click="() => loadTableDemo(editor)">
            表格示例
          </button>
          <button @click="() => loadChartDemo(editor)">
            图表示例
          </button>
          <button @click="() => loadCommentsDemo(editor)">
            评论示例
          </button>
        </div>
      </template>

      <EditorLayoutItem
        name="sidebar"
        position="left"
        :size="200"
      >
        <EditorLayers />
      </EditorLayoutItem>
    </EditorLayout>
  </div>
</template>

<style scoped lang="scss">
.bar{
  min-width: max-content;
  padding: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  button{
    height: 24px;
    padding: 0 8px;
    font-size: 0.75rem;
    border: 1px solid #999;
    border-radius: 8px;
    cursor: pointer;
  }
}
.cropbar{
  position: absolute;
  bottom: -12px;
  transform: translateY(100%);
}
.demobar{
  position: absolute;
  left: 12px;
  top: 12px;
  pointer-events: auto;
}
</style>
