// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({ type: 'lib' }, {
  rules: {
    'no-console': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
    'node/prefer-global/process': 'off',
    'ts/no-namespace': 'off',
    'ts/no-unsafe-declaration-merging': 'off',
    'ts/explicit-function-return-type': 'off',
    'ts/no-empty-object-type': 'off',
    'vue/custom-event-name-casing': 'off',
    'vue/valid-template-root': 'off',
    'vue/valid-v-slot': 'off',
  },
})
