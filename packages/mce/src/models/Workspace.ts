import type { Doc } from './Doc'
import { property } from 'modern-idoc'
import { Model } from './Model'

export interface WorkspaceProps {
  name: string
  type: 'local' | 'cloud'
  createdAt: number
  updatedAt: number
}

export class Workspace extends Model {
  readonly docs = new Map<string, Doc>()

  @property() declare name: string
  @property() declare type: 'local' | 'cloud'
  @property() declare createdAt: string
  @property() declare updatedAt: string

  set(source: Partial<WorkspaceProps> = {}): this {
    super.reset()
    this.setProperties(source)
    return this
  }

  addDoc(doc: Doc): Doc {
    if (this.docs.has(doc.id)) {
      throw new Error('doc already exists')
    }
    this.docs.set(doc.id, doc)
    return doc
  }
}
