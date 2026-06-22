<script setup lang="ts">
import { useEditor } from 'mce'
import { computed } from 'vue'

const {
  presence,
  camera,
  getNodeById,
  getObb,
} = useEditor()

/** 全局画布坐标 → 画板（屏幕）像素，与 box mixin 的 obbToDrawboardObb 同公式。 */
function toDrawboard(p: { x: number, y: number }): { x: number, y: number } {
  const { zoom, position } = camera.value
  return {
    x: p.x * zoom.x - position.x,
    y: p.y * zoom.y - position.y,
  }
}

const cursors = computed(() => {
  return presence.peers.value
    .filter(peer => peer.cursor)
    .map((peer) => {
      const { x, y } = toDrawboard(peer.cursor!)
      return {
        clientId: peer.clientId,
        color: peer.user?.color ?? '#1C7ED6',
        name: peer.user?.name ?? '',
        x,
        y,
      }
    })
})

const selections = computed(() => {
  const boxes: { key: string, color: string, name: string, style: Record<string, string> }[] = []
  presence.peers.value.forEach((peer) => {
    const color = peer.user?.color ?? '#1C7ED6'
    const name = peer.user?.name ?? ''
    // 名字标签只挂在该 peer 的第一个选框上，多选时不刷屏。
    let labeled = false
    peer.selection?.forEach((id) => {
      const node = getNodeById(id)
      if (!node) {
        return
      }
      boxes.push({
        key: `${peer.clientId}:${id}`,
        color,
        name: labeled ? '' : name,
        style: getObb(node, 'drawboard').toCssStyle(),
      })
      labeled = true
    })
  })
  return boxes
})
</script>

<template>
  <div class="m-presence">
    <!-- 远端选框 -->
    <div
      v-for="box in selections"
      :key="box.key"
      class="m-presence-selection"
      :style="{ ...box.style, borderColor: box.color }"
    >
      <span
        v-if="box.name"
        class="m-presence-tag"
        :style="{ backgroundColor: box.color }"
      >{{ box.name }}</span>
    </div>

    <!-- 远端光标 -->
    <div
      v-for="cursor in cursors"
      :key="cursor.clientId"
      class="m-presence-cursor"
      :style="{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }"
    >
      <!-- 箭头尖（热点）必须落在 svg 局部原点 (0,0)：容器按 translate(x,y) 定位其左上角，
           若尖端在 (3,3) 则远端光标会偏在对方实际位置右下 ~3px。路径整体由原 (3,3) 起点平移到 (0,0)。 -->
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M0 0L7 14L8.5 8.5L14 7L0 0Z"
          :fill="cursor.color"
          stroke="#fff"
          stroke-width="1"
          stroke-linejoin="round"
        />
      </svg>
      <span
        v-if="cursor.name"
        class="m-presence-label"
        :style="{ backgroundColor: cursor.color }"
      >{{ cursor.name }}</span>
    </div>
  </div>
</template>

<style lang="scss">
.m-presence {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 10;

  &-selection {
    position: absolute;
    border: 1.5px solid;
    pointer-events: none;
  }

  &-tag {
    position: absolute;
    top: 0;
    left: -1.5px;
    transform: translateY(-100%);
    padding: 1px 6px;
    border-radius: 4px 4px 4px 0;
    color: #fff;
    font-size: 12px;
    line-height: 16px;
    white-space: nowrap;
  }

  &-cursor {
    position: absolute;
    top: 0;
    left: 0;
    will-change: transform;
    // 光标插值：元素初次插入即就位（无 before 值不触发过渡），后续位置变化平滑过渡。
    transition: transform 80ms linear;

    svg {
      display: block;
    }
  }

  &-label {
    position: absolute;
    top: 16px;
    left: 12px;
    padding: 1px 6px;
    border-radius: 4px;
    color: #fff;
    font-size: 12px;
    line-height: 18px;
    white-space: nowrap;
  }
}
</style>
