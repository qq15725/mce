<script lang="ts" setup>
import { Icon, useEditor } from 'mce'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const { state, elementSelection } = useEditor()

const MIN_ROWS = 9 // 1 表头 + 8 数据（与设计稿一致）
const MIN_COLS = 3 // 1 类别列 + 至少 2 系列列
const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const el = computed<any>(() => elementSelection.value[0])
const active = computed(() => state.value === 'chartEditing' && Boolean(el.value?.chart?.isValid?.()))

const chartType = ref('column')
const title = ref('')
const xAxisTitle = ref('')
const yAxisTitle = ref('')
// 二维表格：grid[row][col]，第 0 行为表头，第 0 列为类别。
const grid = ref<string[][]>([])

function emptyGrid(rows = MIN_ROWS, cols = MIN_COLS): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))
}

function load(): void {
  const c = el.value?.chart?.toJSON?.() ?? {}
  chartType.value = c.type ?? 'column'
  title.value = c.title ?? ''
  xAxisTitle.value = c.categoryAxis?.title ?? ''
  yAxisTitle.value = c.valueAxis?.title ?? ''
  const cats: string[] = c.categories ?? []
  const series: { name?: string, values?: number[] }[] = c.series ?? []
  const rows = Math.max(cats.length + 2, MIN_ROWS) // +表头 +1 空行
  const cols = Math.max(series.length + 2, MIN_COLS) // +类别列 +1 空列
  const g = emptyGrid(rows, cols)
  g[0][0] = '类别'
  series.forEach((s, i) => {
    g[0][i + 1] = s.name ?? `系列 ${i + 1}`
  })
  cats.forEach((cat, r) => {
    g[r + 1][0] = String(cat)
  })
  series.forEach((s, ci) => {
    (s.values ?? []).forEach((v, r) => {
      g[r + 1][ci + 1] = String(v)
    })
  })
  grid.value = g
}

watch(active, (on) => {
  if (on) {
    load()
    nextTick(renderPreview)
  }
})

// 编辑最后一行/列时自动补一行/列，便于继续录入。
function ensureSpare(): void {
  const g = grid.value
  if (g.some(row => row[row.length - 1].trim() !== '')) {
    g.forEach(row => row.push(''))
  }
  if (g[g.length - 1].some(c => c.trim() !== '')) {
    g.push(Array.from({ length: g[0].length }, () => ''))
  }
}

function onCell(r: number, c: number, value: string): void {
  grid.value[r][c] = value
  ensureSpare()
  renderPreview()
}

function clearData(): void {
  const g = grid.value
  for (let r = 1; r < g.length; r++) {
    for (let c = 0; c < g[r].length; c++) g[r][c] = ''
  }
  renderPreview()
}

function close(): void {
  state.value = undefined
}

interface ParsedChart {
  categories: string[]
  series: { name: string, values: number[] }[]
}

function parseGrid(): ParsedChart {
  const g = grid.value
  const categories: string[] = []
  const rowIdx: number[] = []
  for (let r = 1; r < g.length; r++) {
    const v = (g[r][0] ?? '').trim()
    if (v) {
      categories.push(v)
      rowIdx.push(r)
    }
  }
  const series: { name: string, values: number[] }[] = []
  for (let c = 1; c < g[0].length; c++) {
    const name = (g[0][c] ?? '').trim()
    const values = rowIdx.map((r) => {
      const n = Number((g[r][c] ?? '').trim())
      return Number.isFinite(n) ? n : 0
    })
    if (name || values.some(v => v !== 0)) {
      series.push({ name: name || `系列 ${c}`, values })
    }
  }
  return { categories, series }
}

function apply(): void {
  const node = el.value
  if (!node) {
    return
  }
  const { categories, series } = parseGrid()
  const base = node.chart?.toJSON?.() ?? {}
  node.chart = {
    ...base,
    type: chartType.value,
    categories,
    series,
    title: title.value || undefined,
    categoryAxis: { ...base.categoryAxis, title: xAxisTitle.value || undefined },
    valueAxis: { ...base.valueAxis, title: yAxisTitle.value || undefined },
  }
  node.requestDraw?.()
  close()
}

// —— echarts 预览（echarts 是本包直接依赖，按需动态加载以免影响初始体积）——
const previewEl = ref<HTMLElement>()
const previewError = ref(false)
let echartsLib: any
let chartInstance: any

function buildOption(): any {
  const { categories, series } = parseGrid()
  const t = chartType.value
  const isPie = t === 'pie' || t === 'doughnut'
  if (isPie) {
    return {
      title: { text: title.value, textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: t === 'doughnut' ? ['40%', '70%'] : '70%',
        data: categories.map((c, i) => ({ name: c, value: series[0]?.values[i] ?? 0 })),
      }],
    }
  }
  const horizontal = t === 'bar'
  const isArea = t === 'area'
  const etype = t === 'line' || isArea ? 'line' : 'bar'
  const catAxis: any = { type: 'category', data: categories, name: xAxisTitle.value || undefined }
  const valAxis: any = { type: 'value', name: yAxisTitle.value || undefined }
  return {
    title: { text: title.value, textStyle: { fontSize: 13 } },
    tooltip: { trigger: 'axis' },
    legend: series.length > 1 ? { bottom: 0 } : undefined,
    grid: { left: 48, right: 16, top: 36, bottom: 32 },
    xAxis: horizontal ? valAxis : catAxis,
    yAxis: horizontal ? catAxis : valAxis,
    series: series.map(s => ({ name: s.name, type: etype, data: s.values, areaStyle: isArea ? {} : undefined })),
  }
}

async function renderPreview(): Promise<void> {
  if (!active.value || !previewEl.value) {
    return
  }
  try {
    if (!echartsLib) {
      echartsLib = await import('echarts')
    }
    if (!chartInstance) {
      chartInstance = echartsLib.init(previewEl.value)
    }
    chartInstance.setOption(buildOption(), true)
    previewError.value = false
  }
  catch {
    previewError.value = true
  }
}

watch([title, xAxisTitle, yAxisTitle, chartType], renderPreview)

function disposePreview(): void {
  chartInstance?.dispose?.()
  chartInstance = undefined
}
watch(active, (on) => {
  if (!on)
    disposePreview()
})
onBeforeUnmount(disposePreview)
</script>

<template>
  <div v-if="active" class="m-chart-editor">
    <div class="m-chart-editor__backdrop" @pointerdown="close" />
    <div class="m-chart-editor__dialog" @pointerdown.stop>
      <header class="m-chart-editor__header">
        <Icon icon="$chartBar" />
        <span class="m-chart-editor__title">图表数据</span>
        <button class="m-chart-editor__close" type="button" @click="close">
          <Icon icon="$close" />
        </button>
      </header>

      <div class="m-chart-editor__body">
        <!-- 数据表格 -->
        <div class="m-chart-editor__grid-wrap">
          <table class="m-chart-editor__grid">
            <thead>
              <tr>
                <th class="m-chart-editor__corner" />
                <th v-for="(_, c) in grid[0]" :key="c">
                  {{ COL_LETTERS[c] }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, r) in grid" :key="r">
                <td class="m-chart-editor__rownum">
                  {{ r + 1 }}
                </td>
                <td v-for="(cell, c) in row" :key="c">
                  <input
                    :value="cell"
                    :class="{ 'is-header': r === 0 }"
                    @input="onCell(r, c, ($event.target as HTMLInputElement).value)"
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 标题 + 预览 -->
        <div class="m-chart-editor__side">
          <label class="m-chart-editor__field">
            <span>主标题</span>
            <input v-model="title" placeholder="请输入主标题">
          </label>
          <label class="m-chart-editor__field">
            <span>X轴标题</span>
            <input v-model="xAxisTitle" placeholder="请输入X轴标题">
          </label>
          <label class="m-chart-editor__field">
            <span>Y轴标题</span>
            <input v-model="yAxisTitle" placeholder="请输入Y轴标题">
          </label>

          <div class="m-chart-editor__preview">
            <div v-show="!previewError" ref="previewEl" class="m-chart-editor__canvas" />
            <div v-if="previewError" class="m-chart-editor__preview-empty">
              预览不可用（未安装 echarts）
            </div>
          </div>
        </div>
      </div>

      <footer class="m-chart-editor__footer">
        <button class="m-chart-editor__btn" type="button" @click="clearData">
          清空数据
        </button>
        <button class="m-chart-editor__btn m-chart-editor__btn--primary" type="button" @click="apply">
          确认修改
        </button>
      </footer>
    </div>
  </div>
</template>

<style lang="scss">
.m-chart-editor {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, .35);
  }

  &__dialog {
    position: relative;
    width: min(1040px, 92vw);
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    background: rgb(var(--m-theme-surface, 255 255 255));
    color: rgb(var(--m-theme-on-surface, 30 30 30));
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, .25);
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 18px 20px;
    font-size: 18px;
    font-weight: 700;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  &__title {
    flex: 1;
  }

  &__close {
    border: none;
    background: none;
    cursor: pointer;
    color: rgba(var(--m-theme-on-surface, 30 30 30), .5);
    display: flex;
    padding: 4px;
    border-radius: 6px;

    &:hover {
      background: rgba(var(--m-theme-on-surface, 30 30 30), .08);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__body {
    flex: 1;
    display: flex;
    gap: 24px;
    padding: 0 20px 8px;
    min-height: 0;
    overflow: auto;
  }

  &__grid-wrap {
    flex: 1;
    overflow: auto;
    border: 1px solid rgba(var(--m-theme-on-surface, 30 30 30), .08);
    border-radius: 8px;
  }

  &__grid {
    border-collapse: collapse;
    width: 100%;
    font-size: 14px;

    th, td {
      border: 1px solid rgba(var(--m-theme-on-surface, 30 30 30), .08);
      text-align: center;
      padding: 0;
      min-width: 96px;
      height: 38px;
    }

    thead th {
      background: rgba(var(--m-theme-on-surface, 30 30 30), .03);
      font-weight: 600;
      color: rgba(var(--m-theme-on-surface, 30 30 30), .55);
    }

    &__corner {
      min-width: 44px !important;
      width: 44px;
    }
  }

  &__rownum {
    min-width: 44px !important;
    width: 44px;
    background: rgba(var(--m-theme-on-surface, 30 30 30), .03);
    color: rgba(var(--m-theme-on-surface, 30 30 30), .55);
    font-weight: 600;
  }

  &__grid input {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    background: none;
    text-align: center;
    font: inherit;
    color: inherit;
    padding: 0 8px;
    box-sizing: border-box;

    &:focus {
      box-shadow: inset 0 0 0 2px rgb(var(--m-theme-primary, 30 200 230));
    }

    &.is-header {
      font-weight: 600;
    }
  }

  &__side {
    width: 380px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 4px;
  }

  &__field {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(var(--m-theme-on-surface, 30 30 30), .12);
    border-radius: 8px;
    padding: 0 12px;
    height: 44px;

    > span {
      flex-shrink: 0;
      color: rgba(var(--m-theme-on-surface, 30 30 30), .55);
      font-size: 14px;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      background: none;
      font: inherit;
      color: inherit;
      height: 100%;
    }
  }

  &__preview {
    flex: 1;
    min-height: 280px;
    border: 1px solid rgba(var(--m-theme-on-surface, 30 30 30), .08);
    border-radius: 8px;
    padding: 8px;
  }

  &__canvas {
    width: 100%;
    height: 100%;
    min-height: 264px;
  }

  &__preview-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(var(--m-theme-on-surface, 30 30 30), .4);
    font-size: 13px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
  }

  &__btn {
    border: 1px solid rgba(var(--m-theme-on-surface, 30 30 30), .15);
    background: rgb(var(--m-theme-surface, 255 255 255));
    color: inherit;
    border-radius: 8px;
    padding: 0 20px;
    height: 40px;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      background: rgba(var(--m-theme-on-surface, 30 30 30), .04);
    }

    &--primary {
      border: none;
      background: rgb(var(--m-theme-primary, 30 200 230));
      color: rgb(var(--m-theme-on-primary, 255 255 255));
      font-weight: 600;
    }
  }
}
</style>
