// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({ type: 'lib' }, {
  rules: {
    'ts/no-namespace': 'off',
    'ts/no-unsafe-declaration-merging': 'off',
  },
})
