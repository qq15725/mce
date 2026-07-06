import type { CommentsApi } from './useComments'
import { definePlugin } from 'mce'
import CommentLayer from './CommentLayer.vue'
import { createCommentsStore } from './useComments'

declare global {
  namespace Mce {
    interface Editor {
      /** 评论数据层（线程读写 + 坐标换算）。 */
      comments: CommentsApi
    }

    interface Tools {
      /** 评论工具（与移动 / 框架 / 形状等单选互斥；激活后点画布放置评论）。 */
      comment: []
    }

    interface Commands {
      /** 切换评论工具（激活 ⇄ 取消）。 */
      toggleCommentMode: () => void
    }
  }
}

export function plugin() {
  return definePlugin((editor) => {
    const { activeTool, activateTool } = editor

    // 评论是工具（非模式）：与移动抓手 / 框架 / 形状等通过 activeTool 单选互斥。
    function isCommentActive(): boolean {
      return activeTool.value?.name === 'comment'
    }
    function toggleCommentMode(): void {
      activateTool(isCommentActive() ? undefined : 'comment')
    }

    // 随插件携带评论图标（核心图标集不硬编码）。与其它工具一致用 MDI 轮廓变体（填充带挖孔 → 描边观感）。
    // 注意：CommentLayer 的评论态鼠标光标须用同一路径 d，保持图标与光标一致。
    editor.registerIcon(
      'comment',
      'M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M10,16V19.08L13,16H20V4H4V16H10Z',
    )

    // 工具腰带一级按钮：activeTool==='comment' 时高亮，与移动等互斥。
    editor.registerToolbeltItem({
      key: 'comment',
      isActive: isCommentActive,
      handle: toggleCommentMode,
    })

    return {
      name: 'mce:comments',
      tools: [
        // handle 为空操作：放置交互由 CommentLayer 的捕获层处理；这里仅让 comment 成为可激活工具。
        { name: 'comment', handle: () => ({}) },
      ],
      commands: [
        { command: 'toggleCommentMode', handle: toggleCommentMode },
      ],
      // 快捷键 C 激活评论工具（与其它工具一致用 activateTool:<name>，工具栏 tooltip 据此显示 C）。
      hotkeys: [
        { command: 'activateTool:comment', key: 'C' },
      ],
      components: [
        // order:'before' → 渲染在 overlay 栈底：catcher 仍在画布之上能接住空白点击，
        // 但工具栏 / 状态栏等上层 UI 的按钮照常可点（评论模式下也能切回）。
        { type: 'overlay', component: CommentLayer, order: 'before' },
      ],
      // 在 setup（有 effect scope，且早于组件挂载）里建数据层并挂到 editor。
      setup: () => {
        editor.comments = createCommentsStore(editor)
      },
      messages: {
        en: {
          'comment': 'Comment',
          'comment:placeholder': 'Add a comment',
          'comment:reply': 'Reply',
          'comment:send': 'Send',
          'comment:resolve': 'Mark as resolved',
          'comment:reopen': 'Re-open',
          'comment:more': 'More',
          'comment:edit': 'Edit',
          'comment:save': 'Save',
          'comment:cancel': 'Cancel',
          'comment:delete': 'Delete thread',
          'comment:deleteReply': 'Delete',
          'comment:close': 'Close',
        },
        zhHans: {
          'comment': '评论',
          'comment:placeholder': '添加评论',
          'comment:reply': '回复',
          'comment:send': '发送',
          'comment:resolve': '标记为已解决',
          'comment:reopen': '重新打开',
          'comment:more': '更多',
          'comment:edit': '编辑',
          'comment:save': '保存',
          'comment:cancel': '取消',
          'comment:delete': '删除评论',
          'comment:deleteReply': '删除',
          'comment:close': '关闭',
        },
      },
    }
  })
}
