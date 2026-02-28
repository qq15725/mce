<script setup lang="ts">
defineProps<{
  active?: boolean
  icon?: boolean
}>()
</script>

<template>
  <div
    class="m-btn"
    :class="{
      'm-btn--active': active,
      'm-btn--icon': icon,
    }"
  >
    <slot />
  </div>
</template>

<style lang="scss">
  .m-btn {
    $root: &;
    padding: 4px;
    border-radius: 4px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover {
      color: rgb(var(--m-theme-on-background));
      background: rgb(var(--m-theme-background));
    }

    &--icon {
      height: 24px;
      width: 24px;
    }

    &#{$root}--active {
      color: rgb(var(--m-theme-on-primary));
      background: rgb(var(--m-theme-primary));
    }
  }
</style>
