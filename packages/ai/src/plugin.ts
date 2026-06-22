import type { Element2D, Node } from 'modern-canvas'
import type { AiActionError } from './aiActions'
import { createShapeElement, definePlugin } from 'mce'
import { AI_ACTION_SCHEMA, validateAiActions } from './aiActions'

declare global {
  namespace Mce {
    interface AiApplyResult {
      /** 新建元素的 id（按动作顺序）。 */
      created: string[]
      /** 被校验拒绝的动作及原因。 */
      errors: AiActionError[]
    }

    interface Commands {
      /**
       * 应用一批 AI action（通常来自 LLM 输出）。先校验/清洗，再在单个 undo 步骤内
       * 映射到现有命令执行。非法项被跳过并在返回值的 errors 中报告。
       */
      applyAi: (actions: unknown) => AiApplyResult
      /** 返回供 LLM 提示的 action schema 描述。 */
      getAiSchema: () => typeof AI_ACTION_SCHEMA
      /**
       * 组装好可直接喂给 LLM 的完整提示词：动作 schema + 当前文档全部节点 id（供引用现有元素）
       * + 用户指令。省去调用方手动拼 prompt。模型按此产出 JSON 动作数组，再交 applyAi 执行。
       */
      getAiPrompt: (userInput: string) => string
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const {
      root,
      getNodeById,
      addElement,
      selection,
      exec,
    } = editor

    /** 收集当前文档所有节点 id，用于校验 action 引用的 id 是否存在。 */
    function collectIds(): Set<string> {
      const ids = new Set<string>()
      root.value?.findOne((node: Node) => {
        ids.add(node.id)
        return false
      })
      return ids
    }

    function findById(id: string): Node | undefined {
      // O(1)：走 SceneTree.nodeMap，替代 root.findOne 的 O(n) 遍历。
      return getNodeById(id)
    }

    function selectByIds(ids: string[]): void {
      selection.value = ids
        .map(findById)
        .filter((n): n is Node => Boolean(n))
    }

    function applyAi(input: unknown): Mce.AiApplyResult {
      const ids = collectIds()
      const { actions, errors } = validateAiActions(input, id => ids.has(id))
      const created: string[] = []

      // 同步顺序执行 → 落在 UndoManager 的同一 capture 窗口内，整批可一次撤销。
      actions.forEach((action) => {
        switch (action.type) {
          case 'createText': {
            const el = exec('addTextElement', {
              content: action.text,
              style: { left: action.x ?? 0, top: action.y ?? 0, ...action.style },
            })
            created.push(el.id)
            break
          }
          case 'createShape': {
            const el = addElement(
              createShapeElement(action.path ? [{ data: action.path }] : undefined, action.fill),
              { position: { x: action.x ?? 0, y: action.y ?? 0 } },
            )
            if (action.width !== undefined) {
              el.style.width = action.width
            }
            if (action.height !== undefined) {
              el.style.height = action.height
            }
            created.push(el.id)
            break
          }
          case 'setStyle': {
            const node = findById(action.id) as Element2D | undefined
            if (node?.style) {
              Object.assign(node.style, action.style)
            }
            break
          }
          case 'move': {
            const node = findById(action.id) as Element2D | undefined
            if (node?.style) {
              node.style.left = action.x
              node.style.top = action.y
            }
            break
          }
          case 'select': {
            selectByIds(action.ids)
            break
          }
          case 'delete': {
            selectByIds(action.ids)
            exec('delete')
            break
          }
          case 'duplicate': {
            selectByIds(action.ids)
            exec('duplicate')
            break
          }
          case 'align': {
            if (action.ids) {
              selectByIds(action.ids)
            }
            exec('align', action.direction)
            break
          }
        }
      })

      return { created, errors }
    }

    function getAiPrompt(userInput: string): string {
      const ids = [...collectIds()]
      return [
        'You are a canvas editing assistant. Reply with ONLY a JSON array of actions.',
        'Each action must strictly match this schema (types and fields):',
        JSON.stringify(AI_ACTION_SCHEMA, null, 2),
        '',
        `Existing node ids you may reference: ${JSON.stringify(ids)}`,
        `User request: ${userInput}`,
      ].join('\n')
    }

    return {
      name: 'mce:ai',
      commands: [
        { command: 'applyAi', handle: applyAi },
        { command: 'getAiSchema', handle: () => AI_ACTION_SCHEMA },
        { command: 'getAiPrompt', handle: getAiPrompt },
      ],
    }
  })
}
