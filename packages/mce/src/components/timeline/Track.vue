<script setup lang="ts">
//
</script>

<template>
  <div class="mce-track">
    <slot />
  </div>
</template>

<style lang="scss">
  .mce-track {
    position: relative;
    display: flex;
    height: 22px;
    background-color: rgb(var(--mce-theme-background));
  }
</style>
