<script lang="ts" setup>
import { Animation, Element2D } from 'modern-canvas'
import { computed } from 'vue'
import { useEditor } from '../../composables'
import Ruler from '../shared/Ruler.vue'
import Playhead from './Playhead.vue'
import Segment from './Segment.vue'
import Track from './Track.vue'
import Trackhead from './Trackhead.vue'

const {
  root,
  msPerPx,
  currentTime,
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
</script>

<template>
  <div class="mce-timeline">
    <div class="mce-timeline__container">
      <div class="mce-timeline__header">
        <Trackhead
          v-for="(node, index) in elements" :key="index"
          :node="node"
        />
      </div>

      <div class="mce-timeline__main">
        <Ruler
          v-model="currentTime"
          :zoom="msPerPx"
        />

        <div
          class="mce-timeline__tracks"
          :style="{
            width: `${endTime * msPerPx}px`,
          }"
        >
          <Track
            v-for="(node, index) in elements" :key="index"
            :node="node"
            :zoom="msPerPx"
          >
            <Segment
              :node="node"
              :zoom="msPerPx"
              :active="selection.some(v => v.equal(node))"
              @click="selection = [node]"
            />
          </Track>
        </div>

        <Playhead
          v-model="currentTime"
          :zoom="msPerPx"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .mce-timeline {
    position: relative;
    height: 220px;
    color: rgb(var(--mce-theme-on-surface));
    background-color: rgb(var(--mce-theme-surface));
    border-top: 1px solid rgb(var(--mce-border-color));
    display: flex;
    flex-direction: column;
    width: 100%;

    &__container {
      display: flex;
      min-height: 0;
      flex: 1;
      overflow: auto;
      overflow: overlay;
    }

    &__header {
      padding-top: 34px;
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      width: var(--timeline-track-header-width, 56px);
      height: max-content;
    }

    &__main {
      display: flex;
      flex-direction: column;
      position: relative;
      min-width: 0;
      flex: 1;
      height: max-content;
      min-height: 100%;
    }

    &__tracks {
      position: relative;
      margin-top: 34px;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
    }
  }
</style>
