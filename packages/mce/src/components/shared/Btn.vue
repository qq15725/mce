<script setup lang="ts">
defineProps<{
  active?: boolean
  icon?: boolean
}>()
</script>

<template>
  <div
    class="mce-btn"
    :class="{
      'mce-btn--active': active,
      'mce-btn--icon': icon,
    }"
  >
    <slot />
  </div>
</template>

<style lang="scss">
  .mce-btn {
    $root: &;
    padding: 4px;
    border-radius: 4px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      color: rgb(var(--mce-theme-on-background));
      background: rgb(var(--mce-theme-background));
    }

    &#{$root}--icon {
      height: 24px;
      width: 24px;
    }

    &#{$root}--active {
      color: rgb(var(--mce-theme-on-primary));
      background: rgb(var(--mce-theme-primary));
    }
  }
</style>
