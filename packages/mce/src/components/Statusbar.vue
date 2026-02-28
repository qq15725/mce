<script lang="ts" setup>
import { useEditor } from '../composables/editor'
import { Icon } from './icon'
import ProgressIndicator from './shared/ProgressIndicator.vue'

const {
  state,
  t,
  getKbd,
  exporting,
  exportProgress,
  selection,
  isElement,
} = useEditor()
</script>

<template>
  <div class="m-statusbar">
    <div class="m-statusbar__main">
      <template
        v-if="state === 'typing'"
      >
        <div class="m-statusbar__item">
          <span class="m-statusbar__kbd">{{ getKbd('Command') }}</span>
          <span class="m-statusbar__kbd">{{ getKbd('Enter') }}</span>
        </div>
        <span>/</span>
        <div class="m-statusbar__item">
          <span class="m-statusbar__kbd">{{ getKbd('Escape') }}</span>
          <span>{{ t('commitChanges') }}</span>
        </div>
      </template>

      <template
        v-else-if="state === 'transforming' || state === 'moving'"
      >
        <div class="m-statusbar__item">
          <Icon icon="$mouseRightClick" />
        </div>
        <span>&nbsp;/&nbsp;</span>
        <div class="m-statusbar__item">
          <span class="m-statusbar__kbd">{{ getKbd('Escape') }}</span>
          <span>{{ t('cancel') }}</span>
        </div>

        <template v-if="state === 'moving'">
          <div class="m-statusbar__divider" />

          <div class="m-statusbar__item">
            <span class="m-statusbar__kbd">{{ getKbd('Shift') }}</span>
            <span>{{ t('constrainMovement') }}</span>
          </div>
        </template>
      </template>

      <span v-else-if="state">{{ t(state) }}</span>

      <template
        v-else
      >
        <div class="m-statusbar__item">
          <Icon icon="$mouseLeftClick" />
          <span>{{ t('selectObject') }}</span>
        </div>

        <span>&nbsp;+&nbsp;</span>

        <div class="m-statusbar__item">
          <span class="m-statusbar__kbd">{{ getKbd('Shift') }}</span>
          <span>{{ t('extend') }}</span>
        </div>

        <div class="m-statusbar__divider" />

        <div class="m-statusbar__item">
          <Icon icon="$mouseLeftClick" />
          <span>{{ t('selectArea') }}</span>
        </div>

        <span>&nbsp;+&nbsp;</span>

        <div class="m-statusbar__item">
          <span class="m-statusbar__kbd">{{ getKbd('Shift') }}</span>
          <span>{{ t('extend') }}</span>
        </div>

        <div class="m-statusbar__divider" />

        <div class="m-statusbar__item">
          <Icon icon="$mouseLeftClick" />
          <span>{{ t('dragSelected') }}</span>
        </div>

        <template
          v-if="selection.length === 1 && isElement(selection[0]) && selection[0].text.isValid()"
        >
          <div class="m-statusbar__divider" />

          <div class="m-statusbar__item">
            <span>{{ getKbd('Enter') }}</span>
            <span>{{ t('startTyping') }}</span>
          </div>
        </template>
      </template>
    </div>

    <div class="m-statusbar__progress">
      <ProgressIndicator
        v-if="exporting"
        v-model="exportProgress"
        :label="t('exporting')"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.m-statusbar {
  user-select: none;
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  line-height: 1;
  width: 100%;
  height: 100%;
  padding: 0 8px;
  background-color: rgba(var(--m-theme-surface), 1);
  color: rgba(var(--m-theme-on-surface), 1);
  font-weight: bold;
  white-space: nowrap;
  overflow-x: auto;

  &__main {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    height: 100%;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 4px;

    > svg {
      width: 1em;
      height: 1em;
    }
  }

  &__divider {
    width: 0;
    height: 60%;
    border-right: 1px solid rgba(var(--m-theme-on-surface), .1);
    margin: 0 8px;
  }

  &__kbd {
    outline: 1px solid rgba(var(--m-theme-on-surface), .1);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    padding: 0 2px;
    font-family: system-ui, -apple-system, sans-serif;
  }
}
</style>
