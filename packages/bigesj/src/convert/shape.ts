import type { NormalizedShape } from 'modern-idoc'
import type { ParsedPresetShapeDefinition } from 'modern-openxml'
import { OoxmlNode, parsePresetShapeDefinition } from 'modern-openxml'

export async function convertShapeElementToShape(el: Record<string, any>): Promise<NormalizedShape> {
  if (!['square', 'circle', 'triangle', 'star', 'line'].includes(el.drawType)) {
    return {
      svg: (await createPresetShape(el.drawType, {
        ...el,
        width: el.style.width,
        height: el.style.height,
      })).svg,
    }
  }

  const when = (flag: boolean, trueVal = '', falseVal = '') => flag ? trueVal : falseVal

  const left = (() => {
    if (el.drawType === 'line') {
      switch (el.left) {
        case 0:
          return 0
        case 1:
        case 2:
        case 3:
          return el.strokeWidth / 1.8
        case 4:
        case 5:
          return el.strokeWidth * 6 - 1
        default:
          return 0
      }
    }
    return 0
  })()

  const right = (() => {
    if (el.drawType === 'line') {
      switch (el.right) {
        case 0:
          return 0
        case 1:
        case 2:
        case 3:
          return el.strokeWidth / 1.8
        case 4:
        case 5:
          return el.strokeWidth * 6 - 1
        default:
          return 0
      }
    }
    return 0
  })()

  const hasPoints = el.drawType === 'star' || el.drawType === 'triangle'

  function pathPoints(cx: number, cy: number, r: number, n: number) {
    const wh = el.style.width / el.style.height
    const alpha = (2 * Math.PI) / n
    let a = Math.PI / 2 + alpha / 2
    let points = 'M '
    const r2 = r * el.r2
    for (let i = 0; i < n; i++) {
      const x = cx + r * Math.cos(a) * wh
      const y = cy + r * Math.sin(a)
      points += `${x},${y} `
      if (i === 0)
        points += 'L '
      if (el.drawType === 'star') {
        const a2 = a + alpha / 2
        const x2 = cx + r2 * Math.cos(a2) * wh
        const y2 = cy + r2 * Math.sin(a2)
        points += `${x2},${y2} `
      }
      a += alpha
    }
    points += 'z'
    return points
  }

  const pathPointsStr = (() => {
    if (!hasPoints)
      return ''
    return pathPoints(
      el.style.width / 2,
      el.style.height / 2,
      el.style.height / 2 - el.strokeWidth,
      el.n,
    )
  })()

  function generateGradient(value: string) {
    const res = parseCssStyleLinearGradient(value)
    if (res.stops.length) {
      const id = `gradient_${el.id}_${Date.now()}`
      const { x1, y1, x2, y2, stops } = res
      return {
        id,
        defs: `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%" gradientUnits="userSpaceOnUse">${stops.join('\n')}</linearGradient>`,
        uses: `url(#${id})`,
      }
    }
    else {
      return undefined
    }
  }

  const fillGradient = generateGradient(el.fill)
  const strokeGradient = generateGradient(el.stroke)

  const doc = `<svg
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 ${el.style.width} ${el.style.height}"
  >
    <defs>${fillGradient?.defs ?? ''} \n ${strokeGradient?.defs ?? ''}</defs>
   ${when(
      el.drawType === 'square',
      `<rect
      x="${el.strokeWidth / 2}"
      y="${el.strokeWidth / 2}"
      width="${el.style.width - el.strokeWidth}"
      height="${el.style.height - el.strokeWidth}"
      rx="${el.r}"
      ry="${el.r}"
      style="fill: ${fillGradient?.uses ?? el.fill};
      stroke-width: ${el.strokeWidth};
      stroke: ${strokeGradient?.uses ?? el.stroke}"
    />`,
    )}
   ${when(
      el.drawType === 'circle',
      `<ellipse
      cx="${el.style.width / 2}"
      cy="${el.style.height / 2}"
      rx="${(el.style.width - el.strokeWidth) / 2}"
      ry="${(el.style.height - el.strokeWidth) / 2}"
      style="fill: ${fillGradient?.uses ?? el.fill};
      stroke-width: ${el.strokeWidth};
      stroke: ${strokeGradient?.uses ?? el.stroke}"
    />`,
    )}
  ${when(
    hasPoints,
    `<path
      d="${pathPointsStr}"
      style="fill: ${fillGradient?.uses ?? el.fill};
      stroke-width: ${el.strokeWidth};
      stroke: ${strokeGradient?.uses ?? el.stroke}"
    />`,
  )}
  ${when(
    el.drawType === 'line',
    `<line
      x1="${left}"
      y1="${el.style.height / 2}"
      x2="${el.style.width - right}"
      y2="${el.style.height / 2}"
      stroke-width="${el.strokeWidth}"
      stroke="${strokeGradient?.uses ?? el.stroke}"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.left === 1,
    `<path
      d="M ${el.strokeWidth * 4} ${el.style.height / 2 - el.strokeWidth * 3} L ${
        el.strokeWidth / 1.4
      } ${el.style.height / 2} L ${el.strokeWidth * 4} ${
        el.style.height / 2 + el.strokeWidth * 3
      }"
      style="stroke-width: ${el.strokeWidth}; stroke: ${strokeGradient?.uses ?? el.stroke};"
      fill="none"
      stroke-linecap="round"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.left === 2,
    `<path
      :d="M ${el.strokeWidth * 4} ${el.style.height / 2 - el.strokeWidth * 3} L 0 ${
        el.style.height / 2
      } L ${el.strokeWidth * 4} ${el.style.height / 2 + el.strokeWidth * 3}"
      fill="${strokeGradient?.uses ?? el.stroke}"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.left === 3,
    `<path
      d="M ${el.strokeWidth * 3} ${el.style.height / 2 - el.strokeWidth * 3} L 0 ${
        el.style.height / 2
      } L ${el.strokeWidth * 3} ${el.style.height / 2 + el.strokeWidth * 3} L ${
        el.strokeWidth * 6
      } ${el.style.height / 2}"
      fill="${strokeGradient?.uses ?? el.stroke}"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.left === 4,
    `<ellipse
      cx="${el.strokeWidth * 3}"
      cy="${el.style.height / 2}"
      rx="${el.strokeWidth * 3}"
      ry="${el.strokeWidth * 3}"
      style="fill: ${strokeGradient?.uses ?? el.stroke};"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.left === 5,
    `<ellipse
      cx="${el.strokeWidth * 3}"
      cy="${el.style.height / 2}"
      rx="${el.strokeWidth * 3 - el.strokeWidth / 2}"
      ry="${el.strokeWidth * 3 - el.strokeWidth / 2}"
      style="fill: none; stroke-width: ${el.strokeWidth}; stroke: ${strokeGradient?.uses ?? el.stroke};"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.right === 1,
    `<path
      d="M ${el.style.width - el.strokeWidth * 4} ${
        el.style.height / 2 - el.strokeWidth * 3
      } L ${el.style.width - el.strokeWidth / 1.4} ${el.style.height / 2} L ${
        el.style.width - el.strokeWidth * 4
      } ${el.style.height / 2 + el.strokeWidth * 3}"
      style="stroke-width: ${el.strokeWidth}; stroke: ${strokeGradient?.uses ?? el.stroke};"
      fill="none"
      stroke-linecap="round"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.right === 2,
    `<path
      d="M ${el.style.width - el.strokeWidth * 4} ${
        el.style.height / 2 - el.strokeWidth * 3
      } L ${el.style.width} ${el.style.height / 2} L ${el.style.width - el.strokeWidth * 4} ${
        el.style.height / 2 + el.strokeWidth * 3
      }"
      fill="${strokeGradient?.uses ?? el.stroke}"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.right === 3,
    `<path
      d="M ${el.style.width - el.strokeWidth * 3} ${
        el.style.height / 2 - el.strokeWidth * 3
      } L ${el.style.width} ${el.style.height / 2} L ${el.style.width - el.strokeWidth * 3} ${
        el.style.height / 2 + el.strokeWidth * 3
      } L ${el.style.width - el.strokeWidth * 6} ${el.style.height / 2}"
      fill="${strokeGradient?.uses ?? el.stroke}"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.right === 4,
    `<ellipse
      cx="${el.style.width - el.strokeWidth * 3}"
      cy="${el.style.height / 2}"
      rx="${el.strokeWidth * 3}"
      ry="${el.strokeWidth * 3}"
      style="fill: ${strokeGradient?.uses ?? el.stroke};"
    />`,
  )}
  ${when(
    el.drawType === 'line' && el.right === 5,
    `<ellipse
      cx="${el.style.width - el.strokeWidth * 3}"
      cy="${el.style.height / 2}"
      rx="${el.strokeWidth * 3 - el.strokeWidth / 2}"
      ry="${el.strokeWidth * 3 - el.strokeWidth / 2}"
      style="fill: none; stroke-width: ${el.strokeWidth}; stroke: ${strokeGradient?.uses ?? el.stroke};"
    />`,
  )}
  </svg>`

  return {
    svg: doc,
  }
}

interface Context {
  width: number
  height: number
  fill?: string
  stroke?: string
  strokeWidth: number
  variables: Record<string, any>
}

type Options = Partial<Context>

export interface BigeParsedPresetShapeDefinition extends ParsedPresetShapeDefinition {
  cate: number
  title: string
  svg: string
}

export const presetShapeCates = {
  1: '线条',
  2: '矩形',
  3: '基本形状',
  4: '箭头汇总',
  5: '公式形状',
  6: '流程图',
  7: '星与旗帜',
  8: '标注',
  9: '动作按钮',
}

function resolveOptions(options: Options): Context {
  return {
    width: 0,
    height: 0,
    strokeWidth: 0,
    ...options,
    variables: { ...options.variables },
  }
}

function _createPresetShape(node: OoxmlNode, options: Options): BigeParsedPresetShapeDefinition {
  const shape = parsePresetShapeDefinition(node)
  return {
    ...shape,
    cate: Number(node.attr('@cate') ?? 0),
    title: node.attr('@title') ?? node.name,
    svg: shape.generateSvgString(resolveOptions(options)),
  }
}

let root: OoxmlNode | undefined
let presetShapes: Record<string, BigeParsedPresetShapeDefinition> | undefined

async function getRoot() {
  if (!root) {
    const presetShapeDefinitions = await import('../assets/presetShapeDefinitions.xml?raw').then(rep => rep.default)
    root = OoxmlNode.fromXML(presetShapeDefinitions)
  }
  return root
}

const excluded = new Set([
  'leftRightCircularArrow',
  'chartX',
  'chartStar',
  'chartPlus',
])

export async function getPresetShapes(options: Options = {}) {
  if (!presetShapes) {
    presetShapes = (await getRoot())
      .get('presetShapeDefinitons/*')
      .filter(node => !excluded.has(node.name))
      .map(node => _createPresetShape(node, {
        width: 18,
        height: 18,
        strokeWidth: 1,
        ...options,
      }))
      .sort((a, b) => a.cate - b.cate)
      .reduce((obj, node) => ({ ...obj, [node.name]: node }), {} as Record<string, any>)
  }
  return presetShapes
}

export async function getPresetShapeGroupds(options: Options = {}) {
  const groups: Record<string, any> = {}
  for (const cate in presetShapeCates) {
    groups[cate] = {
      name: (presetShapeCates as any)[cate],
      shapes: [],
    }
  }
  const shapes = await getPresetShapes(options)
  for (const key in shapes) {
    const shape = shapes[key]
    groups[shape.cate].shapes.push(shape)
  }
  return groups
}

export async function createPresetShape(name: string, options: Options = {}): Promise<BigeParsedPresetShapeDefinition> {
  const node = (await getRoot()).find(name)
  return _createPresetShape(node!, {
    width: 18,
    height: 18,
    strokeWidth: 1,
    ...options,
  })
}

function parseCssStyleLinearGradient(linearGradient: string) {
  const { x1, y1, x2, y2, stops } = convertSvgLinearGradient(linearGradient)
  return {
    x1: ~~(x1 * 10000) / 100,
    y1: ~~(y1 * 10000) / 100,
    x2: ~~(x2 * 10000) / 100,
    y2: ~~(y2 * 10000) / 100,
    stops: stops.map(({ color, offset }) => {
      return `<stop offset="${offset * 100}%" style="stop-color: ${color}" />`
    }),
  }
}

interface SVGLinearStop {
  offset: number // 0~1
  color: string
}

interface SVGLinearGradient {
  x1: number // 0~1
  y1: number // 0~1
  x2: number // 0~1
  y2: number // 0~1
  stops: SVGLinearStop[]
}

function convertSvgLinearGradient(value: SVGLinearGradient): string
function convertSvgLinearGradient(value: string): SVGLinearGradient
function convertSvgLinearGradient(value: SVGLinearGradient | string): string | SVGLinearGradient {
  if (typeof value === 'string') {
    const str = value.match(/linear-gradient\((.+)\)$/)?.[1] ?? ''
    const first = str.split(',')[0]
    const deg = first.includes('deg') ? first : '0deg'
    const matched = str
      // 去除角度部分
      .replace(deg, '')
      // 匹配颜色和位置
      .matchAll(/(#|rgba|rgb)(.+?) ([\d.]+%)/gi)
    const degree = Number(deg.replace('deg', '')) || 0
    const radian = (degree * Math.PI) / 180
    const offsetX = 0.5 * Math.sin(radian)
    const offsetY = 0.5 * Math.cos(radian)
    return {
      x1: 0.5 - offsetX,
      y1: 0.5 + offsetY,
      x2: 0.5 + offsetX,
      y2: 0.5 - offsetY,
      stops: Array.from(matched).map((res) => {
        let color = res[2]
        if (color.startsWith('(')) {
          color = color.split(',').length > 3 ? `rgba${color}` : `rgb${color}`
        }
        else {
          color = `#${color}`
        }
        return {
          offset: Number(res[3].replace('%', '')) / 100,
          color,
        }
      }),
    }
  }
  else {
    const args = []
    const { x1, y1, x2, y2, stops } = value
    const degree = (Math.atan2(y2 - y1, x2 - x1) / Math.PI) * 180
    args.push(`${(degree + 90) % 360}deg`)
    stops.forEach(({ offset, color }) => {
      if (color) {
        args.push([color, `${(offset || 0) * 100}%`].join(' '))
      }
    })
    return `linear-gradient(${args.join(', ')})`
  }
}
