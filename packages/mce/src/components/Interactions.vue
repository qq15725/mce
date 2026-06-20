<script setup lang="ts">
import type { Element2D } from 'modern-canvas'
import { computed, ref } from 'vue'
import { useEditor } from '../composables'
import { createInteractionId } from '../plugins/interactions'
import { Icon } from './icon'

const { elementSelection, frames, exec, t, previewMode, scrollDriven } = useEditor()

const TRIGGERS: Mce.InteractionTrigger[] = ['click', 'pointerEnter', 'pointerLeave', 'load', 'scrollIntoView']
const ACTIONS: Mce.InteractionAction[] = [
  'restart', 'play', 'pause', 'toggle', 'navigate', 'openUrl', 'toggleVisible', 'setVariable',
]

const el = computed(() => elementSelection.value[0] as Element2D | undefined)
const rev = ref(0)
const list = computed<Mce.Interaction[]>(() => {
  void rev.value
  return el.value ? exec('getElementInteractions', el.value) : []
})

const frameOptions = computed(() =>
  frames.value.map(f => ({ id: f.id, name: (f as any).name || f.id })),
)

const variableOptions = computed(() => {
  void rev.value
  const state = exec('getVariablesState')
  return state.collections.flatMap(c =>
    c.variables.map(v => ({ id: v.id, name: `${c.name} / ${v.name}` })),
  )
})

function commit(next: Mce.Interaction[]) {
  exec('setElementInteractions', next, el.value)
  rev.value++
}

function add() {
  commit([...list.value, { id: createInteractionId(), trigger: 'click', action: 'restart' }])
}

function update(i: number, patch: Partial<Mce.Interaction>) {
  commit(list.value.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
}

function remove(i: number) {
  commit(list.value.filter((_, idx) => idx !== i))
}

const OPS: Mce.ConditionOp[] = ['==', '!=', '>', '<']

function setCondVar(i: number, variableId: string) {
  if (!variableId)
    return update(i, { condition: undefined })
  const c = list.value[i].condition
  update(i, { condition: { variableId, op: c?.op ?? '==', value: c?.value ?? '' } })
}

function setCondField(i: number, patch: Partial<Mce.InteractionCondition>) {
  const c = list.value[i].condition
  if (c)
    update(i, { condition: { ...c, ...patch } })
}
</script>

<template>
  <div class="m-interactions">
    <div class="m-interactions__head">
      <button
        class="m-interactions__preview"
        :class="{ 'm-interactions__preview--on': previewMode }"
        type="button"
        @click="exec('togglePreview')"
      >
        <Icon :icon="previewMode ? '$pause' : '$play'" />
        {{ previewMode ? t('exitPreview') : t('preview') }}
      </button>
      <label class="m-interactions__scroll">
        <input v-model="scrollDriven" type="checkbox">
        {{ t('scrollDriven') }}
      </label>
    </div>

    <div v-if="!el" class="m-interactions__empty">
      {{ t('interactionsSelectHint') }}
    </div>

    <template v-else>
      <div
        v-for="(it, i) in list"
        :key="it.id"
        class="m-interactions__row"
      >
        <div class="m-interactions__line">
          <select
            class="m-interactions__select"
            :value="it.trigger"
            @change="update(i, { trigger: ($event.target as HTMLSelectElement).value as Mce.InteractionTrigger })"
          >
            <option v-for="tr in TRIGGERS" :key="tr" :value="tr">
              {{ t(`trigger_${tr}`) }}
            </option>
          </select>
          <Icon icon="$arrowRight" class="m-interactions__arrow" />
          <select
            class="m-interactions__select"
            :value="it.action"
            @change="update(i, { action: ($event.target as HTMLSelectElement).value as Mce.InteractionAction })"
          >
            <option v-for="ac in ACTIONS" :key="ac" :value="ac">
              {{ t(`action_${ac}`) }}
            </option>
          </select>
          <button class="m-interactions__del" type="button" :title="t('removeInteraction')" @click="remove(i)">
            <Icon icon="$close" />
          </button>
        </div>

        <input
          v-if="it.action === 'openUrl'"
          class="m-interactions__param"
          type="text"
          :value="it.url ?? ''"
          placeholder="https://"
          @change="update(i, { url: ($event.target as HTMLInputElement).value })"
        >
        <select
          v-else-if="it.action === 'navigate'"
          class="m-interactions__param"
          :value="it.frameId ?? ''"
          @change="update(i, { frameId: ($event.target as HTMLSelectElement).value })"
        >
          <option value="" disabled>
            {{ t('targetFrame') }}
          </option>
          <option v-for="f in frameOptions" :key="f.id" :value="f.id">
            {{ f.name }}
          </option>
        </select>
        <template v-else-if="it.action === 'setVariable'">
          <select
            class="m-interactions__param"
            :value="it.variableId ?? ''"
            @change="update(i, { variableId: ($event.target as HTMLSelectElement).value })"
          >
            <option value="" disabled>
              {{ t('selectVariable') }}
            </option>
            <option v-for="v in variableOptions" :key="v.id" :value="v.id">
              {{ v.name }}
            </option>
          </select>
          <input
            class="m-interactions__param"
            type="text"
            :value="it.value ?? ''"
            :placeholder="t('variableValue')"
            @change="update(i, { value: ($event.target as HTMLInputElement).value })"
          >
        </template>

        <div class="m-interactions__cond">
          <span class="m-interactions__cond-label">{{ t('conditionWhen') }}</span>
          <select
            class="m-interactions__select"
            :value="it.condition?.variableId ?? ''"
            @change="setCondVar(i, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">
              {{ t('conditionAlways') }}
            </option>
            <option v-for="v in variableOptions" :key="v.id" :value="v.id">
              {{ v.name }}
            </option>
          </select>
          <template v-if="it.condition">
            <select
              class="m-interactions__op"
              :value="it.condition.op"
              @change="setCondField(i, { op: ($event.target as HTMLSelectElement).value as Mce.ConditionOp })"
            >
              <option v-for="op in OPS" :key="op" :value="op">
                {{ op }}
              </option>
            </select>
            <input
              class="m-interactions__cond-val"
              type="text"
              :value="it.condition.value ?? ''"
              :placeholder="t('variableValue')"
              @change="setCondField(i, { value: ($event.target as HTMLInputElement).value })"
            >
          </template>
        </div>
      </div>

      <button class="m-interactions__add" type="button" @click="add">
        <Icon icon="$plus" /> {{ t('addInteraction') }}
      </button>
    </template>
  </div>
</template>

<style lang="scss">
  .m-interactions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    background-color: rgb(var(--m-theme-surface));
    color: rgb(var(--m-theme-on-surface));
    font-size: 0.75rem;

    &__head {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__scroll {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      opacity: 0.85;
    }

    &__preview {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 26px;
      padding: 0 10px;
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      border-radius: 6px;
      background: transparent;
      color: inherit;
      cursor: pointer;

      &--on {
        background-color: rgb(var(--m-theme-on-surface));
        color: rgb(var(--m-theme-surface));
      }
    }

    &__empty {
      opacity: 0.5;
      padding: 8px 2px;
    }

    &__row {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 6px;
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      border-radius: 6px;
    }

    &__line {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    &__arrow {
      opacity: 0.5;
      flex: none;
    }

    &__select,
    &__param {
      height: 24px;
      min-width: 0;
      padding: 0 4px;
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
    }

    &__select {
      flex: 1;
    }

    &__param {
      width: 100%;
    }

    &__cond {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0.85;
    }

    &__cond-label {
      flex: none;
      opacity: 0.6;
    }

    &__op {
      flex: none;
      width: 44px;
      height: 24px;
      padding: 0 2px;
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: center;
    }

    &__cond-val {
      flex: 1;
      min-width: 0;
      height: 24px;
      padding: 0 4px;
      border: 1px solid rgba(var(--m-border-color), var(--m-border-opacity));
      border-radius: 4px;
      background: transparent;
      color: inherit;
      font: inherit;
    }

    &__del {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      flex: none;
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      cursor: pointer;

      &:hover {
        background-color: rgba(var(--m-theme-on-surface), 0.08);
      }
    }

    &__add {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      height: 28px;
      border: 1px dashed rgba(var(--m-border-color), calc(var(--m-border-opacity) * 2));
      border-radius: 6px;
      background: transparent;
      color: inherit;
      cursor: pointer;

      &:hover {
        background-color: rgba(var(--m-theme-on-surface), 0.06);
      }
    }
  }
</style>
