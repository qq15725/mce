<script lang="ts" setup>
import { Animation, Element2D } from 'modern-canvas'
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useEditor } from '../../composables'
import Icon from '../shared/Icon.vue'
import Ruler from '../shared/Ruler.vue'
import Playhead from './Playhead.vue'
import Segment from './Segment.vue'
import Track from './Track.vue'
import Trackhead from './Trackhead.vue'

const {
  root,
  msPerPx,
  currentTime,
  timeline,
  endTime,
  selection,
} = useEditor()

const fps = ref(1000 / 30)
const ruler = useTemplateRef('rulerTpl')
const paused = ref(true)
const position = ref([0, 0])
const wheelSensitivity = 0.02

const elements = computed(() => {
  return root.value?.findAll<Element2D>((node) => {
    if (node instanceof Element2D) {
      if (node.children.some(child => child instanceof Animation)) {
        return true
      }
    }
    return false
  }) ?? []
})

function onWheel(e: WheelEvent) {
  if (e.ctrlKey) {
    const isTouchPad = (e as any).wheelDeltaY
      ? Math.abs(Math.abs((e as any).wheelDeltaY) - Math.abs(3 * e.deltaY)) < 3
      : e.deltaMode === 0

    if (!isTouchPad) {
      e.preventDefault()
      const zoom = msPerPx.value
      const logCur = Math.log(zoom)
      const logDelta = -e.deltaY * wheelSensitivity
      const logNew = logCur + logDelta
      msPerPx.value = Math.exp(logNew)
    }
  }
  else {
    e.preventDefault()
    position.value = [
      Math.min(0, position.value[0] - e.deltaX),
      Math.min(0, position.value[1] - e.deltaY),
    ]
  }
}

function onMousedown(e: MouseEvent) {
  const box = ruler.value.box
  currentTime.value = (e.clientX - box.x + position.value[0]) * msPerPx.value
  const move = (e: MouseEvent) => {
    currentTime.value = (e.clientX - box.x + position.value[0]) * msPerPx.value
  }
  const up = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

function rulerLabelFormat(f: number) {
  if (f % 30 === 0) {
    const m = Math.floor(f / 30 / 60)
    const s = Math.floor(f / 30) % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')
    return `${mm}:${ss}`
  }
  return `${Math.floor(f % 30)}f`
}

let requestId: number | undefined

function play() {
  paused.value = false
  let prevTime: number | undefined
  function loop(time?: number) {
    if (prevTime !== undefined && time !== undefined) {
      timeline.value.addTime(time - prevTime)
    }
    prevTime = time
    requestId = requestAnimationFrame(loop)
  }
  loop()
}

function pause() {
  paused.value = true
  if (requestId !== undefined) {
    cancelAnimationFrame(requestId)
    requestId = undefined
  }
}

function toggle() {
  if (paused.value) {
    play()
  }
  else {
    pause()
  }
}

onBeforeUnmount(pause)
</script>

<template>
  <div
    class="mce-timeline"
    @wheel.prevent
  >
    <div class="mce-timeline__toolbar">
      <div
        class="mce-timeline__play"
        @click="toggle"
      >
        <Icon :icon="paused ? '$play' : '$pause'" />
      </div>
    </div>

    <div class="mce-timeline__main">
      <div class="mce-timeline__left">
        <div class="mce-timeline__left-wrapper">
          <div
            :style="{
              transform: `translateY(${position[1]}px)`,
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
        class="mce-timeline__right"
        @wheel="onWheel"
        @mousedown="onMousedown"
      >
        <div class="mce-timeline__right-wrapper">
          <div class="mce-timeline__ruler">
            <Ruler
              ref="rulerTpl"
              :zoom="1 / msPerPx * fps"
              :unit="100"
              :unit-fractions="[1, 3]"
              style="position: relative;"
              :position="position[0]"
              :axis="false"
              :label-format="rulerLabelFormat"
            />
          </div>

          <div class="mce-timeline__track">
            <div
              :style="{
                width: `${endTime / msPerPx}px`,
                transform: `translate(${position[0]}px, ${position[1]}px)`,
              }"
            >
              <Track
                v-for="(node, index) in elements" :key="index"
              >
                <Segment
                  :node="node"
                  :ms-per-px="msPerPx"
                  :active="selection.some(v => v.equal(node))"
                  @mousedown.stop="selection = [node]"
                />
              </Track>
            </div>
          </div>

          <Playhead
            :style="{
              transform: `translate(${position[0] + Math.ceil(currentTime / msPerPx)}px, 0px)`,
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .mce-timeline {
    position: relative;
    height: 160px;
    color: rgb(var(--mce-theme-on-surface));
    background-color: rgb(var(--mce-theme-surface));
    display: flex;
    flex-direction: column;
    width: 100%;
    border-top: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
    border-bottom: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));

    &__toolbar {
      display: flex;
      align-items: center;
      height: 24px;
      border-bottom: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));
    }

    &__play {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      cursor: pointer;
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
      height: max-content;
      min-height: 100%;
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
      padding-left: 48px;
      border-left: 1px solid rgba(var(--mce-border-color), var(--mce-border-opacity));

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
