export function makeIconProps() {
  return {
    icon: {
      type: [String, Function, Object, Array],
    },
    tag: {
      type: [String, Object, Function],
      default: 'i',
    },
  }
}
