import VueTableEditor from '../components/TableEditor.vue'
import { definePlugin } from '../plugin'

export default definePlugin(() => {
  return {
    name: 'mce:table',
    messages: {
      en: {
        'table:insertRowAbove': 'Insert row above',
        'table:insertRowBelow': 'Insert row below',
        'table:insertColLeft': 'Insert column left',
        'table:insertColRight': 'Insert column right',
        'table:deleteRow': 'Delete rows',
        'table:deleteCol': 'Delete columns',
        'table:mergeCells': 'Merge cells',
        'table:splitCell': 'Split cell',
      },
      zhHans: {
        'table:insertRowAbove': '上方插入行',
        'table:insertRowBelow': '下方插入行',
        'table:insertColLeft': '左侧插入列',
        'table:insertColRight': '右侧插入列',
        'table:deleteRow': '删除行',
        'table:deleteCol': '删除列',
        'table:mergeCells': '合并单元格',
        'table:splitCell': '拆分单元格',
      },
    },
    components: [
      { type: 'overlay', component: VueTableEditor },
    ],
  }
})
