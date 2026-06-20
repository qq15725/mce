<script setup lang="ts">
import type { EasingCoords, Keyframe } from '../../utils'
import { computed, ref } from 'vue'
import { useEditor } from '../../composables'
import { EASING_PRESETS, parseEasing, removeKeyframeAt, setKeyframeEasing, upsertKeyframe } from '../../utils'
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
  const std = new Set<string>(CHANNELS.map(c => c.key))
  const k = active.value
  if (!k)
    return []
  return Object.keys(k).filter(key => !RESERVED.has(key) && !std.has(key))
})

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
        <label v-for="ch in CHANNELS" :key="ch.key" class="m-kfpop__field">
          <span>{{ ch.label }}</span>
          <input
            class="m-kfpop__input"
            type="number"
            :step="ch.step"
            :value="fmt(active[ch.key] ?? ch.def, ch.fixed)"
            @change="setChannel(ch.key, onNumberInput($event))"
          >
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
