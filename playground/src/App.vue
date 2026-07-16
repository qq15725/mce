<script setup lang="ts">
import ai from '@mce/ai'
import animationPresets from '@mce/animation-presets'
import bigesj, { IMAGE_EFFECT_PIPELINE, options } from '@mce/bigesj'
import chart from '@mce/chart'
import collaboration from '@mce/collaboration'
import comments from '@mce/comments'
import flex from '@mce/flex'
import gaoding from '@mce/gaoding'
import gif from '@mce/gif'
import html from '@mce/html'
import mp4 from '@mce/mp4'
import openxml from '@mce/openxml'
import pdf from '@mce/pdf'
import psd from '@mce/psd'
import svg from '@mce/svg'
import table from '@mce/table'
import workflow from '@mce/workflow'
import { Editor, EditorLayers, EditorLayout, EditorLayoutItem } from 'mce'
import { normalizeEffect } from 'modern-idoc'
import { computed } from 'vue'
import { BroadcastChannelProvider } from './collab'
import { demoImagePipelines, loadAnimationDemo, loadArtboardDemo, loadBigParagraphDemo, loadBigTextDemo, loadChartDemo, loadCommentsDemo, loadConnectionDemo, loadFillStrokeDemo, loadGifDemo, loadImageEffectsDemo, loadInteractionDemo, loadLargeExportDemo, loadLayoutDemo, loadLinesDemo, loadPipelinesDemo, loadPsdDemo, loadShapesDemo, loadSmartGuidesDemo, loadTableDemo, loadTextDemo, loadTextFeaturesDemo, loadVideoDemo, loadWorkflowDemo } from './demos'
import 'mce/styles'

const editor = new Editor({
  ...options,
  debug: true,
  plugins: [
    flex(),
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
    animationPresets(),
    html(),
    workflow(),
    collaboration(),
    comments(),
  ],
})

// 注册自定义管线，供 floatbar 动态测试（动态增删管线是否闪烁/消失）。
demoImagePipelines.forEach(p => editor.registerImagePipeline(p))

window.editor = editor
window.doc = editor.doc

// 明暗主题切换：驱动画布语义色 token（@surface / @on-surface / @outline）随之解析。
function toggleTheme(): void {
  editor.setTheme(editor.theme.value === 'dark' ? 'light' : 'dark')
}

// 动态给选中元素的前景设置图片处理管线（undefined = 清空，回到原图）。
function setFgPipelines(imagePipelines?: { name: string, params?: Record<string, any> }[]): void {
  const el = editor.elementSelection.value[0]
  if (!el) {
    return
  }
  ;(el.foreground as any).imagePipelines = imagePipelines
}

// 导出当前文档为指定格式并下载（用于冒烟验证导出链，含图片处理管线的烘焙）。
async function exportAs(fmt: 'svg' | 'png' | 'pdf' | 'pptx'): Promise<void> {
  const res: any = await editor.to(fmt as any)
  const blob = typeof res === 'string' ? new Blob([res], { type: 'image/svg+xml' }) : res
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `export.${fmt}`
  a.click()
  URL.revokeObjectURL(url)
}

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
else if (demo === 'workflow') {
  loadWorkflowDemo(editor)
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
else if (demo === 'pipelines') {
  loadPipelinesDemo(editor)
}
else if (demo === 'shapes') {
  loadShapesDemo(editor)
}
else if (demo === 'lines') {
  loadLinesDemo(editor)
}
else if (demo === 'text') {
  loadTextDemo(editor)
}
else if (demo === 'textFeatures') {
  loadTextFeaturesDemo(editor)
}
else if (demo === 'bigText') {
  loadBigTextDemo(editor)
}
else if (demo === 'bigParagraph') {
  loadBigParagraphDemo(editor)
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
else if (demo === 'psd') {
  loadPsdDemo(editor)
}
else if (demo === 'largeExport') {
  loadLargeExportDemo(editor)
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
      <!-- 自定义「生成中」效果可用此插槽完全覆盖默认 shimmer（作用域收 node / box）：
      <template #workflow-generating="{ node }"> ... </template> -->
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
            <span style="width: 1px; align-self: stretch; background: rgba(0,0,0,.15)" />
            <button @click="() => setFgPipelines([{ name: 'demo:grayscale' }])">
              灰度
            </button>
            <button @click="() => setFgPipelines([{ name: 'demo:invert' }])">
              反色
            </button>
            <button @click="() => setFgPipelines([{ name: 'demo:tint', params: { color: '#ff0066', strength: 0.5 } }])">
              染色
            </button>
            <button @click="() => setFgPipelines([{ name: 'demo:grayscale' }, { name: 'demo:tint', params: { color: '#00aaff', strength: 0.45 } }])">
              灰度+染色
            </button>
            <button @click="() => setFgPipelines([{ name: IMAGE_EFFECT_PIPELINE, params: { effects: [normalizeEffect({ outline: { width: 8, color: '#ff3366' } })] } }])">
              描边
            </button>
            <button @click="() => setFgPipelines(undefined)">
              清空管线
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
          <button @click="() => loadArtboardDemo(editor)">
            画板示例
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
          <button @click="() => loadPipelinesDemo(editor)">
            图片管线示例
          </button>
          <span style="width: 1px; align-self: stretch; background: rgba(0,0,0,.15)" />
          <button @click="() => exportAs('svg')">
            导出SVG
          </button>
          <button @click="() => exportAs('png')">
            导出PNG
          </button>
          <button @click="() => exportAs('pdf')">
            导出PDF
          </button>
          <button @click="() => exportAs('pptx')">
            导出PPTX
          </button>
          <button @click="() => loadLargeExportDemo(editor)">
            大图导出示例
          </button>
          <button @click="() => loadShapesDemo(editor)">
            形状示例
          </button>
          <button @click="() => loadLinesDemo(editor)">
            直线箭头示例
          </button>
          <button @click="() => loadTextFeaturesDemo(editor)">
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
          <button @click="() => loadPsdDemo(editor)">
            PSD 示例
          </button>
          <button @click="() => loadWorkflowDemo(editor)">
            工作流示例
          </button>
          <button @click="toggleTheme">
            主题: {{ editor.theme.value === 'dark' ? '🌙 暗' : '☀️ 亮' }}
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
  // 按钮多于一行宽度时换行（覆盖 .bar 的 min-width: max-content，否则会强制单行不换）。
  // max-width 给出换行边界，条本身仍随内容收缩（按钮少时不会撑成整条白条）。
  flex-wrap: wrap;
  min-width: 0;
  max-width: calc(100% - 24px);
}
</style>
