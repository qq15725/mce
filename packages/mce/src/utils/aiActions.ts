/**
 * AI 画布 Agent 的「带类型 action schema」层（参考 tldraw AI SDK 范式）。
 *
 * LLM 不直接改像素，而是产出一组结构化 action；本模块负责**校验 / 清洗**——
 * 拒绝结构非法项、丢弃不存在的节点 id、强制数值有限——再交由插件在单个 undo 事务内
 * 映射到现有 exec 命令执行。校验是纯函数，无编辑器耦合，可独立单测。
 */

export const AI_ALIGN_DIRECTIONS = [
  'left',
  'horizontal-center',
  'right',
  'top',
  'vertical-center',
  'bottom',
] as const

export type AiAlignDirection = typeof AI_ALIGN_DIRECTIONS[number]

export type AiAction
  = | { type: 'createText', text: string, x?: number, y?: number, style?: Record<string, any> }
    | { type: 'createShape', x?: number, y?: number, width?: number, height?: number, fill?: string, path?: string }
    | { type: 'setStyle', id: string, style: Record<string, any> }
    | { type: 'move', id: string, x: number, y: number }
    | { type: 'delete', ids: string[] }
    | { type: 'select', ids: string[] }
    | { type: 'duplicate', ids: string[] }
    | { type: 'align', direction: AiAlignDirection, ids?: string[] }

export interface AiActionError {
  index: number
  reason: string
}

export interface AiValidationResult {
  actions: AiAction[]
  errors: AiActionError[]
}

function isObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function finiteNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function sanitizeIds(ids: unknown, hasNode: (id: string) => boolean): string[] {
  if (!Array.isArray(ids)) {
    return []
  }
  return ids.filter((id): id is string => typeof id === 'string' && hasNode(id))
}

/**
 * 校验并清洗一批 AI action。
 * @param input 任意（通常是 LLM 输出解析后的 JSON）。
 * @param hasNode 判定某节点 id 是否存在于当前文档；默认全部存在（便于纯逻辑测试）。
 */
export function validateAiActions(
  input: unknown,
  hasNode: (id: string) => boolean = () => true,
): AiValidationResult {
  const actions: AiAction[] = []
  const errors: AiActionError[] = []
  const list = Array.isArray(input) ? input : []

  list.forEach((raw, index) => {
    if (!isObject(raw)) {
      errors.push({ index, reason: '不是合法对象' })
      return
    }

    switch (raw.type) {
      case 'createText': {
        if (typeof raw.text !== 'string' || raw.text === '') {
          errors.push({ index, reason: 'createText 需要非空 text' })
          return
        }
        actions.push({
          type: 'createText',
          text: raw.text,
          x: finiteNumber(raw.x),
          y: finiteNumber(raw.y),
          style: isObject(raw.style) ? raw.style : undefined,
        })
        return
      }
      case 'createShape': {
        actions.push({
          type: 'createShape',
          x: finiteNumber(raw.x),
          y: finiteNumber(raw.y),
          width: finiteNumber(raw.width),
          height: finiteNumber(raw.height),
          fill: typeof raw.fill === 'string' ? raw.fill : undefined,
          path: typeof raw.path === 'string' ? raw.path : undefined,
        })
        return
      }
      case 'setStyle': {
        if (typeof raw.id !== 'string' || !hasNode(raw.id)) {
          errors.push({ index, reason: `setStyle 引用了不存在的 id: ${String(raw.id)}` })
          return
        }
        if (!isObject(raw.style)) {
          errors.push({ index, reason: 'setStyle 需要 style 对象' })
          return
        }
        actions.push({ type: 'setStyle', id: raw.id, style: raw.style })
        return
      }
      case 'move': {
        if (typeof raw.id !== 'string' || !hasNode(raw.id)) {
          errors.push({ index, reason: `move 引用了不存在的 id: ${String(raw.id)}` })
          return
        }
        const x = finiteNumber(raw.x)
        const y = finiteNumber(raw.y)
        if (x === undefined || y === undefined) {
          errors.push({ index, reason: 'move 需要有限数值 x, y' })
          return
        }
        actions.push({ type: 'move', id: raw.id, x, y })
        return
      }
      case 'delete':
      case 'select':
      case 'duplicate': {
        const ids = sanitizeIds(raw.ids, hasNode)
        if (ids.length === 0) {
          errors.push({ index, reason: `${raw.type} 需要至少一个存在的 id` })
          return
        }
        actions.push({ type: raw.type, ids })
        return
      }
      case 'align': {
        if (!AI_ALIGN_DIRECTIONS.includes(raw.direction)) {
          errors.push({ index, reason: `align 的 direction 非法: ${String(raw.direction)}` })
          return
        }
        actions.push({
          type: 'align',
          direction: raw.direction,
          ids: raw.ids === undefined ? undefined : sanitizeIds(raw.ids, hasNode),
        })
        return
      }
      default:
        errors.push({ index, reason: `未知 action 类型: ${String(raw.type)}` })
    }
  })

  return { actions, errors }
}

/**
 * 供 LLM 提示的 action schema 描述（JSON 可序列化）。消费方把它喂给模型，
 * 模型据此产出 action 数组，再经 validateAiActions 校验后由 applyAiActions 执行。
 */
export const AI_ACTION_SCHEMA = {
  createText: { text: 'string (required)', x: 'number?', y: 'number?', style: 'object?' },
  createShape: { x: 'number?', y: 'number?', width: 'number?', height: 'number?', fill: 'string?', path: 'svg path data string?' },
  setStyle: { id: 'string (required, existing node)', style: 'object (required)' },
  move: { id: 'string (required, existing node)', x: 'number (required)', y: 'number (required)' },
  delete: { ids: 'string[] (required, existing nodes)' },
  select: { ids: 'string[] (required, existing nodes)' },
  duplicate: { ids: 'string[] (required, existing nodes)' },
  align: { direction: AI_ALIGN_DIRECTIONS, ids: 'string[]? (defaults to current selection)' },
} as const
