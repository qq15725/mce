import { createVNode, defineComponent } from 'vue'
import { makeIconProps } from './makeIconProps'

export const ComponentIcon = defineComponent({
  name: 'MceComponentIcon',
  props: makeIconProps(),
  setup(props, { slots }) {
    return () => {
      return createVNode(props.tag as any, null, {
        default: () => [
          props.icon
            ? createVNode(props.icon as any, null, null)
            : slots.default?.(),
        ],
      })
    }
  },
})
