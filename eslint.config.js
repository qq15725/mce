// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({ type: 'lib' }, {
  rules: {
    'ts/no-namespace': 'off',
    'ts/no-unsafe-declaration-merging': 'off',
    'vue/custom-event-name-casing': 'off',
    'no-console': 'off',
    'ts/explicit-function-return-type': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
    'ts/no-empty-object-type': 'off',
  },
})
