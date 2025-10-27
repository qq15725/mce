<script setup lang="ts">
//
</script>

<template>
  <div
    class="mce-payhead"
  >
    <header class="mce-payhead__header" />
    <main class="mce-payhead__main" />
  </div>
</template>

<style lang="scss">
  .mce-payhead {
    bottom: 0;
    left: -5px;
    position: absolute;
    top: 0;
    width: 10px;
    color: rgb(var(--mce-theme-on-surface));
    cursor: col-resize;

    &__header {
      position: relative;
      background-color: transparent;
      border: 2px solid currentColor;
      border-bottom: none;
      height: 12px;
      left: 0;
      position: -webkit-sticky;
      position: sticky;
      right: 0;
      top: 0;
      width: 10px;

      &:after {
        box-sizing: content-box;
        content: "";
        background-color: transparent;
        border-bottom: 2px solid currentColor;
        border-right: 2px solid currentColor;
        bottom: 0;
        display: block;
        height: 5px;
        position: absolute;
        right: 0;
        transform: rotate(45deg) translate(2.8px, 2px);
        width: 5px;
      }
    }

    &__main {
      background-color: currentColor;
      bottom: 0;
      left: 4px;
      position: absolute;
      top: 16px;
      transform: translateX(0.5px);
      width: 1px;
    }
  }
</style>
