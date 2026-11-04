<script setup lang="ts">
import { Video2D } from 'modern-canvas'
import { computed } from 'vue'
import { useEditor } from '../../composables/editor'
import { Icon } from '../icon'

const { elementSelection, selectionAabbInDrawboard, paused, currentTime, exec, t, state, readonly } = useEditor()
const video = computed(() => elementSelection.value.length === 1 && elementSelection.value[0] instanceof Video2D
  ? elementSelection.value[0]
  : undefined)
const playing = computed(() => !paused.value && video.value && (video.value.loop
  || currentTime.value < video.value.globalStartTime + video.value.videoDuration))
const position = computed(() => {
  const box = selectionAabbInDrawboard.value
  return { left: `${box.left + box.width / 2}px`, top: `${box.top + box.height / 2}px` }
})
</script>

<template>
  <button
    v-if="video?.src && !state && !readonly"
    type="button"
    class="m-video-playback"
    :style="position"
    :aria-label="t('togglePlay')"
    :title="t('togglePlay')"
    @pointerdown.stop
    @dblclick.stop
    @click.stop="playing ? exec('pause') : exec('playVideo', video)"
  >
    <Icon :icon="playing ? '$pause' : '$play'" />
  </button>
</template>

<style scoped>
.m-video-playback {
  position: absolute;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: rgb(0 0 0 / 60%);
  color: white;
  cursor: pointer;
  pointer-events: auto;
}
</style>
