<script setup lang="ts">
</script>

<template>
  <a class="mce-made-with" href="https://github.com/qq15725/mce" target="_blank">
    <div>MADE WITH</div>
    <div>MCE</div>
  </a>
</template>

<style lang="scss">
  .mce-made-with {
    pointer-events: auto !important;
    position: absolute;
    right: 18px;
    bottom: 18px;
    opacity: .38;
    color: #000;
    text-align: center;
    font-size: 12px;
    line-height: 1;
    border: 2px solid currentColor;
    padding: 2px 4px;
    border-radius: 4px;
    box-sizing: border-box;
    font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
    text-decoration: none;

    div:last-child {
      font-weight: bold;
      letter-spacing: 1px;
    }
  }
</style>
