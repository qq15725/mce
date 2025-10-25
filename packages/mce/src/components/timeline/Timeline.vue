<script lang="ts" setup>
import { Animation, Element2D } from 'modern-canvas'
import { computed, onBeforeUnmount, ref } from 'vue'
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

function formatTick(input: number) {
  input = Math.floor(input / 1000)
  const m = Math.floor(input / 60)
  const s = input % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return `${mm}:${ss}`
}

const paused = ref(true)
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
  <div class="mce-timeline">
    <div class="mce-timeline__toolbar">
      <div
        class="mce-timeline__play"
        @click="toggle"
      >
        <Icon :icon="paused ? '$play' : '$pause'" />
      </div>
    </div>

    <div class="mce-timeline__main">
      <div class="mce-timeline__ruler">
        <Ruler
          v-model="currentTime"
          :zoom="msPerPx"
          style="position: relative;"
          :axis="false"
          :format="formatTick"
        />
      </div>

      <div class="mce-timeline__track-wrapper">
        <div class="mce-timeline__track-headers">
          <Trackhead
            v-for="(node, index) in elements" :key="index"
            :node="node"
          />
        </div>

        <div class="mce-timeline__track-bodys">
          <div
            :style="{
              width: `${endTime * msPerPx}px`,
            }"
          >
            <Track
              v-for="(node, index) in elements" :key="index"
            >
              <Segment
                :node="node"
                :zoom="msPerPx"
                :active="selection.some(v => v.equal(node))"
                @mousedown.stop="selection = [node]"
              />
            </Track>
          </div>
        </div>
      </div>

      <Playhead
        v-model="currentTime"
        :offset="60"
        :zoom="msPerPx"
      />
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
      flex-direction: column;
      min-height: 0;
      flex: 1;
      overflow: auto;
      overflow: overlay;
    }

    &__ruler {
      position: relative;
      width: 100%;
      height: 24px;
      min-height: 24px;
      padding-left: 56px;
    }

    &__track-wrapper {
      position: relative;
      display: flex;
      min-width: 0;
      flex: 1;
      overflow-y: auto;
      overflow-y: overlay;
    }

    &__track-headers {
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      width: 56px;
      height: max-content;
      padding-left: 4px;
    }

    &__track-bodys {
      position: relative;
      display: flex;
      flex-direction: column-reverse;
      justify-content: start;
      gap: 8px;
      flex: 1;
      height: max-content;
      overflow-x: auto;
      overflow-x: overlay;
    }
  }
</style>
