<script lang="ts" setup>
import { useEditor } from '../composables/editor'

const {
  exec,
  getKbd,
  t,
} = useEditor()
</script>

<template>
  <div class="mce-starter">
    <div class="mce-starter__container">
      <div
        class="mce-starter__btn"
        @click="exec('new')"
      >
        <IconPhFileFill />
        <span>{{ t('new') }}</span>
        <div class="mce-starter__kbd">
          <kbd
            v-for="(char, key) in getKbd('new').split('').filter(v => v !== ' ')"
            :key="key"
            v-text="char"
          />
        </div>
      </div>

      <div
        class="mce-starter__btn"
        @click="exec('open')"
      >
        <IconPhFolderFill />
        <span>{{ t('open') }}</span>
        <div class="mce-starter__kbd">
          <kbd
            v-for="(char, key) in getKbd('open').split('').filter(v => v !== ' ')"
            :key="key"
            v-text="char"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.mce-starter {
  pointer-events: auto;
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(var(--mce-theme-surface), 1);
  display: flex;
  align-items: center;
  justify-content: center;

  &__container {
    display: flex;
    margin: auto;
    flex-direction: column;
    gap: 8px;
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background-color: rgba(var(--mce-theme-background), 1);
    }
  }

  &__kbd {
    margin-left: 4px;
    display: flex;
    gap: 4px;

    kbd {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      width: 1.2em;
      height: 1.2em;
      border: 1px solid rgba(var(--mce-theme-on-surface), 1);
    }
  }
}
</style>
