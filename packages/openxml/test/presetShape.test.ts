import type { ParsedPresetShapeDefinition } from 'modern-openxml'
import { Element2D } from 'modern-canvas'
import { expect, it } from 'vitest'
import { presetShapeGeometry, setPresetShape } from '../src/presetShape'

it('replaces and resets a non-square preset without leaving adjustment state', () => {
  const element = new Element2D({ style: { width: 150, height: 40 }, meta: { unrelated: 1 } })
  const preset = {
    name: 'triangle',
    generatePaths({ width, height, variables }: any) {
      variables.internal = 1
      return [{ data: `M0 0L${width} ${height}H0Z` }]
    },
  } as ParsedPresetShapeDefinition
  const variables = { adj: 3 }
  expect(presetShapeGeometry(preset, 150, 40, variables).viewBox).toEqual([0, 0, 150, 40])
  expect(variables).toEqual({ adj: 3 })
  setPresetShape(element, preset)
  expect(element.meta.shapeName).toBe('triangle')
  expect(element.shape.paths[0]?.data).toBe('M0 0L150 40H0Z')
  setPresetShape(element)
  element.style.width = 200
  expect(element.shape.paths[0]?.data).toBe('M0 0H1V1H0Z')
  expect(element.meta.toJSON()).toMatchObject({ unrelated: 1 })
  expect(element.meta.shapeName).toBeUndefined()
  expect(element.meta.shapeVariables).toBeUndefined()
})
