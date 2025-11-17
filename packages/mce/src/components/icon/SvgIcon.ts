import { createElementVNode, createVNode, defineComponent, mergeProps } from 'vue'
import { makeIconProps } from './makeIconProps'

export const SvgIcon = defineComponent({
  name: 'MceSvgIcon',
  inheritAttrs: false,
  props: makeIconProps(),
  setup(props, { attrs }) {
    return () => {
      return createVNode(props.tag as any, mergeProps(attrs, { style: null }), {
        default: () => [
          createElementVNode('svg', {
            'class': 'mce-icon__svg',
            'xmlns': 'http://www.w3.org/2000/svg',
            'viewBox': '0 0 24 24',
            'role': 'img',
            'aria-hidden': 'true',
          }, [
            Array.isArray(props.icon)
              ? props.icon.map(path => Array.isArray(path)
                  ? createElementVNode('path', {
                      'd': path[0],
                      'fill-opacity': path[1],
                    }, null)
                  : createElementVNode('path', {
                      d: path,
                    }, null))
              : createElementVNode('path', {
                  d: props.icon,
                }, null),
          ]),
        ],
      })
    }
  },
})
