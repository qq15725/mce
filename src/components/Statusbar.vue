<script lang="ts" setup>
import { useEditor } from '../composables/editor'

const {
  status,
  t,
  getKbd,
} = useEditor()
</script>

<template>
  <div class="mce-statusbar">
    <template v-if="status === 'typing'">
      <div class="mce-statusbar__item">
        <span class="mce-statusbar__kbd">{{ getKbd('Command') }}</span>
        <span class="mce-statusbar__kbd">{{ getKbd('Enter') }}</span>
      </div>
      <span>/</span>
      <div class="mce-statusbar__item">
        <span class="mce-statusbar__kbd">{{ getKbd('Escape') }}</span>
        <span>{{ t('commitChanges') }}</span>
      </div>
    </template>

    <template v-else-if="status === 'transforming'">
      <div class="mce-statusbar__item">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M144 16h-32a64.07 64.07 0 0 0-64 64v96a64.07 64.07 0 0 0 64 64h32a64.07 64.07 0 0 0 64-64V80a64.07 64.07 0 0 0-64-64m-32 16h16v72H64V80a48.05 48.05 0 0 1 48-48m32 192h-32a48.05 48.05 0 0 1-48-48v-56h128v56a48.05 48.05 0 0 1-48 48" /></svg>
      </div>
      <span>/</span>
      <div class="mce-statusbar__item">
        <span class="mce-statusbar__kbd">{{ getKbd('Escape') }}</span>
        <span>{{ t('cancel') }}</span>
      </div>

      <div class="mce-statusbar__divider" />

      <div class="mce-statusbar__item">
        <span class="mce-statusbar__kbd">{{ getKbd('Shift') }}</span>
        <span>{{ t('constrainToAxis') }}</span>
      </div>
    </template>

    <span v-else-if="status">{{ t(status) }}</span>

    <template v-else>
      <div class="mce-statusbar__item">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M144 16h-32a64.07 64.07 0 0 0-64 64v96a64.07 64.07 0 0 0 64 64h32a64.07 64.07 0 0 0 64-64V80a64.07 64.07 0 0 0-64-64m48 64v24h-64V32h16a48.05 48.05 0 0 1 48 48m-48 144h-32a48.05 48.05 0 0 1-48-48v-56h128v56a48.05 48.05 0 0 1-48 48" /></svg>
        <span>{{ t('selectObject') }}</span>
      </div>
      <span>+</span>
      <div class="mce-statusbar__item">
        <span class="mce-statusbar__kbd">{{ getKbd('Shift') }}</span>
        <span>{{ t('extend') }}</span>
      </div>

      <div class="mce-statusbar__divider" />

      <div class="mce-statusbar__item">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M144 16h-32a64.07 64.07 0 0 0-64 64v96a64.07 64.07 0 0 0 64 64h32a64.07 64.07 0 0 0 64-64V80a64.07 64.07 0 0 0-64-64m48 64v24h-64V32h16a48.05 48.05 0 0 1 48 48m-48 144h-32a48.05 48.05 0 0 1-48-48v-56h128v56a48.05 48.05 0 0 1-48 48" /></svg>
        <span>{{ t('selectArea') }}</span>
      </div>
      <span>+</span>
      <div class="mce-statusbar__item">
        <span class="mce-statusbar__kbd">{{ getKbd('Shift') }}</span>
        <span>{{ t('extend') }}</span>
      </div>

      <div class="mce-statusbar__divider" />

      <div class="mce-statusbar__item">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256"><path fill="currentColor" d="M144 16h-32a64.07 64.07 0 0 0-64 64v96a64.07 64.07 0 0 0 64 64h32a64.07 64.07 0 0 0 64-64V80a64.07 64.07 0 0 0-64-64m48 64v24h-64V32h16a48.05 48.05 0 0 1 48 48m-48 144h-32a48.05 48.05 0 0 1-48-48v-56h128v56a48.05 48.05 0 0 1-48 48" /></svg>
        <span>{{ t('dragSelected') }}</span>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.mce-statusbar {
  user-select: none;
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 1;
  width: 100%;
  height: 24px;
  padding: 0 8px;
  background-color: rgba(var(--mce-theme-surface), 1);
  color: rgba(var(--mce-theme-on-surface), 1);
  font-weight: bold;

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
    border-right: 1px solid rgba(var(--mce-theme-on-surface), .2);
    margin: 0 8px;
  }

  &__kbd {
    outline: 1px solid rgba(var(--mce-theme-on-surface), .4);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    padding: 0 2px;
    font-family: system-ui, -apple-system, sans-serif;
  }
}
</style>
