<script setup lang="ts">
defineProps<{
  label?: string
  indeterminate?: boolean
}>()

const progress = defineModel<number>({ default: 0 })
</script>

<template>
  <div class="progress-indicator">
    <span v-if="label" class="progress-indicator__status">{{ label }}</span>

    <div class="progress-indicator__bar">
      <div
        v-if="!indeterminate"
        class="progress-indicator__bar-fill"
        :style="{ width: `${progress * 100}%` }"
      />

      <div
        v-else
        class="progress-indicator__bar-indeterminate"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .progress-indicator {
    display: flex;
    align-items: center;
    gap: 12px;

    &__status {
      font-size: 0.75rem;
      color: rgb(var(--mce-theme-on-surface));
    }

    &__bar {
      position: relative;
      width: 100px;
      height: 6px;
      background-color: rgb(var(--mce-theme-background));
      border-radius: 4px;
      overflow: hidden;

      &-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background-color: rgb(var(--mce-theme-primary));
        transition: width 0.3s ease;
      }

      &-indeterminate {
        position: absolute;
        top: 0;
        left: -30%;
        width: 30%;
        height: 100%;
        background-color: #3b82f6;
        animation: indeterminate-slide 1.5s linear infinite;
      }
    }
  }

  @keyframes indeterminate-slide {
    0%   { left: -30%; }
    100% { left: 100%;  }
  }
</style>
