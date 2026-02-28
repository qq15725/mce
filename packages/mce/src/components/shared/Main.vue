<script lang="ts" setup>
import { useLayout } from '../../composables/layout'

const props = defineProps({
  scrollable: Boolean,
})

const { mainStyles } = useLayout()
</script>

<template>
  <main
    class="m-main"
    :class="[
      { 'm-main--scrollable': props.scrollable },
    ]"
    :style="[mainStyles]"
  >
    <div v-if="props.scrollable" class="m-main__scroller">
      <slot />
    </div>

    <slot v-else />
  </main>
</template>

<style lang="scss">
  .m-main {
    flex: 1 0 auto;
    max-width: 100%;
    padding-left: var(--m-layout-left);
    padding-right: var(--m-layout-right);
    padding-top: var(--m-layout-top);
    padding-bottom: var(--m-layout-bottom);

    &__scroller {
      max-width: 100%;
      position: relative;
    }

    &--scrollable {
      display: flex;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      & > .v-main__scroller {
        flex: 1 1 auto;
        overflow-y: auto;
        --v-layout-left: 0px;
        --v-layout-right: 0px;
        --v-layout-top: 0px;
        --v-layout-bottom: 0px;
      }
    }
  }
</style>
