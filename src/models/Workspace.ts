import type * as Y from 'yjs'
import type { Doc } from './Doc'
import { markRaw } from 'vue'
import { Model } from './Model'

export type WorkspacePropsYMap = Y.Map<unknown> & {
  get:
    & ((prop: 'id') => string)
    & ((prop: 'name') => string)
    & ((prop: 'type') => 'local' | 'cloud')
    & ((prop: 'createdAt') => number)
    & ((prop: 'updatedAt') => number)
    & (<T = unknown>(prop: string) => T)
}

export class Workspace extends Model {
  readonly props: WorkspacePropsYMap
  readonly docMap = new Map<string, Doc>()

  constructor(id: string) {
    super(id)
    this.props = markRaw(this.doc.getMap('props') as WorkspacePropsYMap)
  }

  setProps(props: Record<string, any>): this {
    this.transact(() => {
      for (const [key, value] of Object.entries(props)) {
        this.props.set(key, value)
      }
    })
    return this
  }

  addDoc(doc: Doc): Doc {
    if (this.docMap.has(doc.id)) {
      throw new Error('doc already exists')
    }
    this.docMap.set(doc.id, doc)
    return doc
  }
}
