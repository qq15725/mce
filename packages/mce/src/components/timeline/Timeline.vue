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
    <!-- toolbar -->

    <div class="mce-timeline__main">
      <div class="mce-timeline__ruler">
        <Ruler
          v-model="currentTime"
          :zoom="msPerPx"
          style="position: relative;"
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
        </div>
      </div>

      <Playhead
        v-model="currentTime"
        :zoom="msPerPx"
      />
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

    &__main {
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
      height: 30px;
      min-height: 30px;
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
