<script setup lang="ts">
import type { EasingCoords, Keyframe } from '../../utils'
import { computed, ref } from 'vue'
import { useEditor } from '../../composables'
import { EASING_PRESETS, parseEasing, parseTransform, removeKeyframeAt, setKeyframeEasing, setTransformField, transformFields, upsertKeyframe } from '../../utils'
import { Icon } from '../icon'
import Overlay from '../shared/Overlay.vue'
import EasingCurve from './EasingCurve.vue'

// 关键帧编辑收敛到时间轴轨道：点击动画块上的菱形标记，在其上方弹出本浮层。
// 不再有常驻底部面板。数值 / 缓动沿用 modern-canvas 的扁平关键帧格式直接读写。
const { keyframeEditing, root, exec, t } = useEditor()

const CHANNELS = [
  { key: 'left', label: 'X', step: 1, fixed: 0, def: 0 },
  { key: 'top', label: 'Y', step: 1, fixed: 0, def: 0 },
  { key: 'rotate', label: '°', step: 1, fixed: 1, def: 0 },
  { key: 'scaleX', label: 'sx', step: 0.01, fixed: 2, def: 1 },
  { key: 'scaleY', label: 'sy', step: 0.01, fixed: 2, def: 1 },
  { key: 'opacity', label: 'α', step: 0.01, fixed: 2, def: 1 },
] as const

const RESERVED = new Set(['offset', 'easing'])
// 这些键由专门 UI 处理，不进 extraKeys 的通用数值输入。
const HANDLED = new Set([...CHANNELS.map(c => c.key), 'transform', 'transformOrigin'])

const editing = computed(() => keyframeEditing.value)
const anim = computed(() => editing.value?.anim)
const offset = computed(() => editing.value?.offset ?? 0)
const keyframes = computed<Keyframe[]>(
  () => (anim.value?.keyframes as unknown as Keyframe[] | undefined) ?? [],
)
const active = computed<Keyframe | undefined>(
  () => keyframes.value.find(k => k.offset === offset.value),
)

// 缓动：解析当前关键帧 easing（名字 / cubic-bezier / 自定义）为控制点供曲线图显示，
// 拖手柄则写回 cubic-bezier 字符串，选预设则写回预设名。
const customRev = ref(0)
const customEasings = computed<Record<string, string>>(() => {
  void customRev.value // 注册新预设后手动触发刷新（meta 读取非响应式）
  return exec('getEasings')
})
const easingCoords = computed<EasingCoords>(
  () => parseEasing(active.value?.easing ?? 'linear', customEasings.value),
)
const presetName = computed(() => {
  const e = active.value?.easing ?? 'linear'
  return e in EASING_PRESETS || e in customEasings.value ? e : 'custom'
})
const easingOptions = computed(() => {
  const base = [...Object.keys(EASING_PRESETS), ...Object.keys(customEasings.value)]
  return presetName.value === 'custom' ? ['custom', ...base] : base
})

function onPreset(value: string) {
  if (value !== 'custom')
    setEasing(value)
}

function onCurve(coords: EasingCoords) {
  setEasing(`cubic-bezier(${coords.map(n => Math.round(n * 100) / 100).join(',')})`)
}

// 把当前自定义曲线存为命名预设（复用 registerEasing，存于文档 meta），并选中它。
const saving = ref(false)
const newPresetName = ref('')
function startSave() {
  saving.value = true
  newPresetName.value = ''
}
function confirmSave() {
  const name = newPresetName.value.trim()
  saving.value = false
  if (!name)
    return
  exec('registerEasing', name, `cubic-bezier(${easingCoords.value.join(',')})`)
  customRev.value++
  setEasing(name)
}

const extraKeys = computed(() => {
  const k = active.value
  if (!k)
    return []
  return Object.keys(k).filter(key => !RESERVED.has(key) && !HANDLED.has(key))
})

// transform 关键帧（WAAPI 原始写法）：解析成分量供编辑，改完序列化写回字符串。
const transformStr = computed(() =>
  typeof active.value?.transform === 'string' ? active.value.transform : undefined,
)
const hasTransform = computed(() => transformStr.value != null)
const transformFns = computed(() => transformStr.value ? parseTransform(transformStr.value) : [])
const tFields = computed(() => transformFields(transformFns.value))
const transformOrigin = computed(() =>
  typeof active.value?.transformOrigin === 'string' ? active.value.transformOrigin : '',
)
// 有 transform 时位置/缩放/旋转由 transform 接管，只额外露出 opacity 通道。
const visibleChannels = computed(() =>
  hasTransform.value ? CHANNELS.filter(c => c.key === 'opacity') : CHANNELS,
)

// model-value 由「有正在编辑的关键帧」驱动；Overlay 的点击外关闭会置 false → 关闭浮层。
const open = computed({
  get: () => Boolean(editing.value && active.value),
  set: (v) => {
    if (!v)
      keyframeEditing.value = null
  },
})

function fmt(v: unknown, fixed: number): string {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n))
    return '0'
  return Number(n.toFixed(fixed)).toString()
}

function commit(next: Keyframe[]): void {
  const a = anim.value
  if (!a)
    return
  root.value?.transact(() => {
    a.keyframes = next as any
  })
}

function setChannel(key: string, value: number) {
  if (!active.value || !Number.isFinite(value))
    return
  commit(upsertKeyframe(keyframes.value, { offset: offset.value, [key]: value }))
}

function setTransform(fnIndex: number, argIndex: number, value: number) {
  if (!active.value || !Number.isFinite(value))
    return
  const next = setTransformField(transformFns.value, fnIndex, argIndex, value)
  commit(upsertKeyframe(keyframes.value, { offset: offset.value, transform: next }))
}

function setTransformOrigin(value: string) {
  if (!active.value)
    return
  commit(upsertKeyframe(keyframes.value, { offset: offset.value, transformOrigin: value }))
}

function setEasing(value: string) {
  if (!active.value)
    return
  commit(setKeyframeEasing(keyframes.value, offset.value, value))
}

function removeActive() {
  if (!active.value)
    return
  commit(removeKeyframeAt(keyframes.value, offset.value))
  keyframeEditing.value = null
}

function onNumberInput(e: Event): number {
  return Number((e.target as HTMLInputElement).value)
}
</script>

<template>
  <Overlay
    v-model="open"
    location="top"
    :offset="10"
    :target="editing?.target"
  >
    <div v-if="active" class="m-kfpop__body">
      <div class="m-kfpop__head">
        <span class="m-kfpop__pct">{{ Math.round(active.offset * 100) }}%</span>

        <template v-if="saving">
          <input
            v-model="newPresetName"
            class="m-kfpop__select"
            :placeholder="t('saveEasingPreset')"
            autofocus
            @keyup.enter="confirmSave"
            @keyup.esc="saving = false"
          >
          <button
            class="m-kfpop__btn"
            type="button"
            :title="t('saveEasingPreset')"
            @click="confirmSave"
          >
            <Icon icon="$check" />
          </button>
        </template>

        <template v-else>
          <select
            class="m-kfpop__select"
            :value="presetName"
            @change="onPreset(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in easingOptions" :key="opt" :value="opt">
              {{ opt === 'custom' ? t('custom') : opt }}
            </option>
          </select>
          <button
            v-if="presetName === 'custom'"
            class="m-kfpop__btn"
            type="button"
            :title="t('saveEasingPreset')"
            @click="startSave"
          >
            <Icon icon="$plus" />
          </button>
        </template>

        <button
          class="m-kfpop__btn"
          type="button"
          :title="t('removeKeyframe')"
          @click="removeActive"
        >
          <Icon icon="$close" />
        </button>
      </div>

      <EasingCurve
        :model-value="easingCoords"
        @update:model-value="onCurve"
      />

      <div class="m-kfpop__channels">
        <label v-for="ch in visibleChannels" :key="ch.key" class="m-kfpop__field">
          <span>{{ ch.label }}</span>
          <input
            class="m-kfpop__input"
            type="number"
            :step="ch.step"
            :value="fmt(active[ch.key] ?? ch.def, ch.fixed)"
            @change="setChannel(ch.key, onNumberInput($event))"
          >
        </label>

        <!-- transform 分量（解析自 WAAPI transform 字符串） -->
        <label
          v-for="(f, i) in tFields"
          :key="`t${i}`"
          class="m-kfpop__field"
        >
          <span>{{ f.label }}</span>
          <input
            class="m-kfpop__input"
            type="number"
            step="0.01"
            :value="fmt(f.value, 2)"
            @change="setTransform(f.fnIndex, f.argIndex, onNumberInput($event))"
          >
          <span v-if="f.unit" class="m-kfpop__unit">{{ f.unit }}</span>
        </label>

        <label v-for="key in extraKeys" :key="key" class="m-kfpop__field">
          <span>{{ key }}</span>
          <input
            class="m-kfpop__input"
            type="number"
            step="0.01"
            :value="fmt(active[key] ?? 0, 2)"
            @change="setChannel(key, onNumberInput($event))"
          >
        </label>
      </div>

      <label v-if="hasTransform" class="m-kfpop__field m-kfpop__field--wide">
        <span>origin</span>
        <input
          class="m-kfpop__input"
          type="text"
          :value="transformOrigin"
          :placeholder="t('default')"
          @change="setTransformOrigin(($event.target as HTMLInputElement).value)"
        >
      </label>
    </div>
  </Overlay>
</template>

<style lang="scss">
  .m-kfpop {
    &__body {
      box-sizing: border-box;
      width: 248px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      border-radius: 6px;
      background-color: rgb(var(--m-theme-surface));
      color: rgb(var(--m-theme-on-surface));
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
      font-size: 0.75rem;
      user-select: none;
    }

    &__head {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__pct {
      min-width: 36px;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }

    &__channels {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px 8px;
    }

    &__field {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-width: 0;

      > span {
        opacity: 0.6;
        min-width: 14px;
      }

      &--wide {
        grid-column: 1 / -1;
        display: flex;
      }
    }

    &__unit {
      opacity: 0.5;
      font-size: 0.7rem;
    }

    &__input,
    &__select {
      height: 22px;
      padding: 0 4px;
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-variant-numeric: tabular-nums;

      &:focus {
        outline: none;
        border-color: rgb(var(--m-theme-on-surface));
      }
    }

    &__input {
      width: 100%;
      min-width: 0;
    }

    &__select {
      flex: 1;
      min-width: 0;
    }

    &__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      cursor: pointer;

      &:hover {
        background-color: rgba(var(--m-theme-on-surface), 0.08);
      }
    }
  }
</style>
