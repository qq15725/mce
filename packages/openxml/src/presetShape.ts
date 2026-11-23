import type { Element2D } from 'mce'
import type { ParsedPresetShapeDefinition } from 'modern-openxml'

/** Keep preset paths in the same coordinate space as their adjustment handles. */
export function presetShapeGeometry(shape: ParsedPresetShapeDefinition, width: number, height: number, variables?: Record<string, number>) {
  return {
    enabled: true,
    viewBox: [0, 0, width, height],
    paths: shape.generatePaths({ width, height, variables: { ...variables } }),
  }
}

/** Replacing or clearing a preset also clears the previous adjustment parameters. */
export function setPresetShape(element: Element2D, shape?: ParsedPresetShapeDefinition) {
  element.shape = shape
    ? presetShapeGeometry(shape, element.style.width, element.style.height)
    : { enabled: true, preset: 'rect', viewBox: [0, 0, 1, 1], paths: [{ data: 'M0 0H1V1H0Z' }] }
  element.meta = { ...element.meta.toJSON(), shapeName: shape?.name, shapeVariables: shape ? {} : undefined }
}
