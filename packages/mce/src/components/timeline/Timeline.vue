<script lang="ts" setup>
import type { Element2D, TimelineNode } from 'modern-canvas'
import { Animation, IN_MAC_OS, Video2D } from 'modern-canvas'
import { computed, onBeforeMount, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useEditor } from '../../composables'
import { Icon } from '../icon'
import Ruler from '../shared/Ruler.vue'
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
  exec,
  t,
  assets,
} = editor

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

      <div class="m-timeline__toolbar-spacer" />

      <button
        class="m-timeline__btn"
        type="button"
        :title="t('collapse')"
        @click="exec('togglePanel', 'timeline', 'toggle')"
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
              v-for="(node, index) in elements" :key="index"
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
                v-for="(node, index) in elements" :key="index"
              >
                <Segment
                  :node="node"
                  :ms-per-px="msPerPx"
                  :end-time="endTime"
                  :active="selection.some(v => v.equal(node))"
                  @mousedown.stop="selection = [node]"
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
