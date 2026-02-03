<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, ref } from 'vue'

const used = ref(0)
const total = ref(0)

function humanBytes(bytes: number): string {
  if (!bytes)
    return ''
  const num = 1024.0
  if (bytes < num)
    return `${bytes}B`
  if (bytes < num ** 2)
    return `${(bytes / num).toFixed(2)}KB`
  if (bytes < num ** 3)
    return `${(bytes / num ** 2).toFixed(2)}MB`
  if (bytes < num ** 4)
    return `${(bytes / num ** 3).toFixed(2)}G`
  return `${(bytes / num ** 4).toFixed(2)}T`
}

async function update() {
  const performance = window.performance
  if ('memory' in performance) {
    const memory = performance.memory as any
    used.value = memory.usedJSHeapSize
    total.value = memory.totalJSHeapSize
  }
}

let timer: any | unknown

onBeforeMount(() => {
  const request = (requestIdleCallback || requestAnimationFrame)
  request(update)
  timer = setInterval(() => request(update), 2000)
})

onBeforeUnmount(() => timer && clearInterval(timer))
</script>

<template>
  <div class="mce-manage-memory">
    <div>Total memory used</div>
    <div>{{ humanBytes(used) }}</div>
  </div>
</template>

<style lang="scss">
  .mce-manage-memory {
    padding: 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
