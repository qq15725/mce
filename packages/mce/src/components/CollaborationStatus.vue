<script lang="ts" setup>
import { computed } from 'vue'
import { useEditor } from '../composables/editor'

const {
  collaboration,
  presence,
  t,
} = useEditor()

/** 连接 / 同步状态：offline → connecting → synced。 */
const status = computed<'offline' | 'connecting' | 'synced'>(() => {
  if (!collaboration.connected.value) {
    return 'offline'
  }
  return collaboration.synced.value ? 'synced' : 'connecting'
})

const MAX_AVATARS = 5

const avatars = computed(() => {
  const peers = presence.peers.value
  return peers.slice(0, MAX_AVATARS).map(peer => ({
    clientId: peer.clientId,
    name: peer.user?.name ?? '',
    color: peer.user?.color ?? '#868E96',
    avatar: peer.user?.avatar,
    initial: (peer.user?.name ?? '?').trim().charAt(0).toUpperCase() || '?',
  }))
})

const overflow = computed(() => Math.max(0, presence.peers.value.length - MAX_AVATARS))
</script>

<template>
  <div v-if="collaboration.active.value" class="m-collab-status">
    <span class="m-collab-status__dot" :class="`m-collab-status__dot--${status}`" />
    <span class="m-collab-status__label">{{ t(`collaboration:${status}`) }}</span>

    <div v-if="avatars.length" class="m-collab-status__avatars">
      <span
        v-for="peer in avatars"
        :key="peer.clientId"
        class="m-collab-status__avatar"
        :style="{ backgroundColor: peer.color }"
        :title="peer.name"
      >
        <img v-if="peer.avatar" :src="peer.avatar" :alt="peer.name">
        <template v-else>{{ peer.initial }}</template>
      </span>
      <span v-if="overflow" class="m-collab-status__avatar m-collab-status__avatar--more">
        +{{ overflow }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.m-collab-status {
  display: flex;
  align-items: center;
  gap: 6px;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--synced {
      background-color: #0CA678;
    }

    &--connecting {
      background-color: #F59F00;
    }

    &--offline {
      background-color: rgba(var(--m-theme-on-surface), .3);
    }
  }

  &__label {
    opacity: .7;
  }

  &__avatars {
    display: flex;
    align-items: center;
    margin-left: 4px;
  }

  &__avatar {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.625rem;
    font-weight: bold;
    overflow: hidden;
    border: 1.5px solid rgba(var(--m-theme-surface), 1);
    margin-left: -6px;

    &:first-child {
      margin-left: 0;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &--more {
      background-color: rgba(var(--m-theme-on-surface), .3);
    }
  }
}
</style>
