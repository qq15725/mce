<script lang="ts" setup>
import type { Element2D, TimelineNode } from 'modern-canvas'
import { Animation, IN_MAC_OS, Video2D } from 'modern-canvas'
import { computed, onBeforeMount, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useAnimationPresetsMenu, useEditor } from '../../composables'
import { Icon } from '../icon'
import Menu from '../shared/Menu.vue'
import Ruler from '../shared/Ruler.vue'
import KeyframePopover from './KeyframePopover.vue'
import Playhead from './Playhead.vue'
import Segment from './Segment.vue'
import Track from './Track.vue'
import Trackhead from './Trackhead.vue'

const editor = useEditor()
const {
  isElement,
  root,
  msPerPx,
  currentTime,
  endTime,
  selection,
  paused,
  fps,
  playbackRate,
  loopMode,
  exec,
  t,
  assets,
  animationPresets,
} = editor

const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4]
const LOOP_MODES = ['none', 'loop', 'alternate'] as const
const loopLabel: Record<string, string> = {
  none: 'loopOnce',
  loop: 'loopAll',
  alternate: 'loopPingpong',
}

const ruler = useTemplateRef('rulerTpl')
const offset = ref([0, 0])

// Trigger for content state changes the computed cannot deeply observe
// (animatedTexture finishing load on nested elements, late hydration, …).
// Combines explicit asset events with a low-frequency poll while the panel
// is mounted — cheap, and avoids tracks staying invisible until the user
// happens to activate the element.
const tracksRev = ref(0)
function bumpTracksRev() {
  tracksRev.value++
}
let pollId: ReturnType<typeof setInterval> | undefined
onBeforeMount(() => {
  assets.on('loaded', bumpTracksRev)
  pollId = setInterval(bumpTracksRev, 500)
})
onBeforeUnmount(() => {
  assets.off('loaded', bumpTracksRev)
  if (pollId !== undefined) {
    clearInterval(pollId)
    pollId = undefined
  }
})

function hasAnimatedContent(el: Element2D): boolean {
  if (el.children.some(c => c instanceof Animation))
    return true
  return Boolean(
    el.background?.animatedTexture
    || el.foreground?.animatedTexture
    || el.fill?.animatedTexture
    || el.outline?.animatedTexture,
  )
}

// 轨道成员纯派生：有动画内容 / Video 才上轴，与 selection 无关（不再临时注入选中元素）。
const elements = computed(() => {
  void endTime.value
  void tracksRev.value
  return root.value.findAll<TimelineNode>((node) => {
    if (node instanceof Video2D)
      return true
    if (isElement(node) && hasAnimatedContent(node))
      return true
    return false
  }).reverse()
})

// 选中元素里还没动画的那些——「+ 添加动画」入口的可见性与作用对象。
const animatableSelection = computed(
  () => selection.value.filter(n => isElement(n) && !hasAnimatedContent(n as Element2D)) as Element2D[],
)

const animAddMenu = ref(false)

// 预设动画菜单：按 进入 / 退出 / 强调 分组（与 Trackhead 一致）。
const presetMenu = useAnimationPresetsMenu(editor, (p) => {
  for (const el of animatableSelection.value)
    exec('applyAnimationPreset', p.id, el)
  // 主动刷新，让新轨道即时出现，不必等 tracksRev 轮询。
  bumpTracksRev()
})

function pad(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0')
}

function formatTime(ms: number): string {
  const safe = Number.isFinite(ms) ? ms : 0
  const totalFrames = Math.round(safe / 1000 * fps.value)
  const f = totalFrames % fps.value
  const s = Math.floor(totalFrames / fps.value) % 60
  const m = Math.floor(totalFrames / fps.value / 60)
  return `${pad(m)}:${pad(s)}.${pad(f)}`
}

const currentLabel = computed(() => formatTime(currentTime.value))
const totalLabel = computed(() => formatTime(endTime.value))

function onWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const factor = e.ctrlKey && IN_MAC_OS ? 10 : 1
    const delta = e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002) * factor
    const logCur = Math.log(msPerPx.value)
    const logNew = logCur + delta
    msPerPx.value = Math.exp(logNew)
  }
  else {
    e.preventDefault()
    offset.value = [
      Math.min(0, offset.value[0] - e.deltaX),
      Math.min(0, offset.value[1] - e.deltaY),
    ]
  }
}

function onMousedown(e: MouseEvent) {
  const box = ruler.value?.box
  if (box) {
    currentTime.value = (e.clientX - box.left - offset.value[0]) * msPerPx.value
    const move = (e: MouseEvent) => {
      currentTime.value = (e.clientX - box.left - offset.value[0]) * msPerPx.value
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
}

function rulerLabelFormat(f: number) {
  const framesPerSec = fps.value
  if (f % framesPerSec === 0) {
    const m = Math.floor(f / framesPerSec / 60)
    const s = Math.floor(f / framesPerSec) % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')
    return `${mm}:${ss}`
  }
  return `${Math.floor(f % framesPerSec)}f`
}
</script>

<template>
  <div
    class="m-timeline"
    @wheel.prevent
  >
    <div class="m-timeline__toolbar">
      <div class="m-timeline__time">
        <span>{{ currentLabel }}</span>
        <span class="m-timeline__time-sep">/</span>
        <span class="m-timeline__time--muted">{{ totalLabel }}</span>
      </div>

      <div class="m-timeline__controls">
        <button
          class="m-timeline__btn"
          type="button"
          :title="t('seekStart')"
          @click="exec('seekStart')"
        >
          <Icon icon="$skipPrevious" />
        </button>
        <button
          class="m-timeline__btn"
          type="button"
          :title="t('stepBackward')"
          @click="exec('stepBackward')"
        >
          <Icon icon="$stepBackward" />
        </button>
        <button
          class="m-timeline__btn m-timeline__btn--primary"
          type="button"
          :title="paused ? t('play') : t('pause')"
          @click="exec('togglePlay')"
        >
          <Icon :icon="paused ? '$play' : '$pause'" />
        </button>
        <button
          class="m-timeline__btn"
          type="button"
          :title="t('stepForward')"
          @click="exec('stepForward')"
        >
          <Icon icon="$stepForward" />
        </button>
        <button
          class="m-timeline__btn"
          type="button"
          :title="t('seekEnd')"
          @click="exec('seekEnd')"
        >
          <Icon icon="$skipNext" />
        </button>
      </div>

      <select
        v-model.number="playbackRate"
        class="m-timeline__select"
        :title="t('playbackRate')"
      >
        <option v-for="s in SPEEDS" :key="s" :value="s">
          {{ s }}×
        </option>
      </select>

      <select
        v-model="loopMode"
        class="m-timeline__select"
        :title="t('loopMode')"
      >
        <option v-for="m in LOOP_MODES" :key="m" :value="m">
          {{ t(loopLabel[m]) }}
        </option>
      </select>

      <Menu
        v-if="animatableSelection.length && animationPresets.length"
        v-model="animAddMenu"
        :items="presetMenu"
        location="bottom-start"
        :offset="4"
      >
        <template #activator="{ props: activatorProps }">
          <button
            type="button"
            class="m-timeline__btn m-timeline__add-anim"
            :class="{ 'm-timeline__add-anim--active': animAddMenu }"
            :title="t('addAnimation')"
            v-bind="activatorProps"
          >
            <Icon icon="$plus" />
            <span>{{ t('addAnimation') }}</span>
          </button>
        </template>
        <template #title="{ item }">
          {{ t(item.key) }}
        </template>
      </Menu>

      <div class="m-timeline__toolbar-spacer" />

      <button
        class="m-timeline__btn"
        type="button"
        :title="t('collapse')"
        @click="exec('togglePanel', 'timeline')"
      >
        <Icon icon="$arrowDown" />
      </button>
    </div>

    <div class="m-timeline__main">
      <div
        class="m-timeline__left"
        @wheel="onWheel"
      >
        <div class="m-timeline__left-wrapper">
          <div
            :style="{
              transform: `translateY(${offset[1]}px)`,
            }"
          >
            <Trackhead
              v-for="node in elements" :key="node.id"
              :node="node"
            />
          </div>
        </div>
      </div>

      <div
        class="m-timeline__right"
        @wheel="onWheel"
        @mousedown="onMousedown"
      >
        <div class="m-timeline__right-wrapper">
          <div class="m-timeline__ruler">
            <Ruler
              ref="rulerTpl"
              :zoom="1000 / msPerPx / fps"
              :unit="100"
              :unit-fractions="[1, 3]"
              style="position: relative;"
              :position="-offset[0]"
              :label-format="rulerLabelFormat"
            />
          </div>

          <div class="m-timeline__track">
            <div
              :style="{
                width: `${endTime / msPerPx}px`,
                transform: `translate(${offset[0]}px, ${offset[1]}px)`,
              }"
            >
              <Track
                v-for="node in elements" :key="node.id"
              >
                <Segment
                  :node="node"
                  :ms-per-px="msPerPx"
                  :end-time="endTime"
                  :rev="tracksRev"
                  :active="selection.some(v => v.equal(node))"
                />
              </Track>
            </div>
          </div>

          <Playhead
            :style="{
              transform: `translate(${offset[0] + Math.ceil(currentTime / msPerPx)}px, 0px)`,
            }"
          />
        </div>
      </div>
    </div>

    <KeyframePopover />
  </div>
</template>

<style lang="scss">
  .m-timeline {
    position: relative;
    color: rgb(var(--m-theme-on-surface));
    background-color: rgb(var(--m-theme-surface));
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    &__toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 28px;
      padding: 0 8px;
      border-bottom: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      font-size: 0.75rem;
      user-select: none;
    }

    &__time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      font-variant-numeric: tabular-nums;
      min-width: 120px;

      &-sep {
        opacity: 0.5;
      }

      &--muted {
        opacity: 0.5;
      }
    }

    &__controls {
      display: flex;
      align-items: center;
      gap: 2px;
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

      &:active {
        background-color: rgba(var(--m-theme-on-surface), 0.16);
      }

      &--primary {
        width: 26px;
        height: 26px;
      }
    }

    &__add-anim {
      width: auto;
      gap: 4px;
      padding: 0 8px;

      &--active {
        background-color: rgba(var(--m-theme-on-surface), 0.16);
      }
    }

    &__select {
      height: 22px;
      padding: 0 4px;
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 0.75rem;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: rgb(var(--m-theme-on-surface));
      }
    }

    &__toolbar-spacer {
      flex: 1;
    }

    &__main {
      position: relative;
      display: flex;
      min-height: 0;
      flex: 1;
    }

    &__left {
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      width: 120px;
      height: 100%;
      padding-top: 24px;
      overflow: hidden;

      &-wrapper {
        position: relative;
        height: 100%;
        width: 100%;
        padding: 0 0 0 4px;
      }
    }

    &__right {
      position: relative;
      display: flex;
      min-width: 0;
      flex: 1;
      overflow: hidden;
      flex-direction: column;
      border-left: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      padding-left: 48px;

      &-wrapper {
        position: relative;
        height: 100%;
        width: 100%;
      }
    }

    &__ruler {
      position: relative;
      width: 100%;
      height: 24px;
      min-height: 24px;

      &, * {
        cursor: default;
      }
    }

    &__track {
      position: relative;
      display: flex;
      flex-direction: column-reverse;
      justify-content: start;
      gap: 8px;
      flex: 1;
      height: max-content;
      min-height: 100%;
      overflow: hidden;
    }
  }
</style>
