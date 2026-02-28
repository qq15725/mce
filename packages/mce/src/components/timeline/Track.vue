<script setup lang="ts">
//
</script>

<template>
  <div class="m-track">
    <slot />
  </div>
</template>

<style lang="scss">
  .m-track {
    position: relative;
    display: flex;
    height: 22px;
    background-color: rgb(var(--m-theme-background));
  }
</style>
