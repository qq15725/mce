import type { DocModel } from './DocModel'
import { property } from 'modern-idoc'
import * as Y from 'yjs'

export interface WorkspaceEntity {
  id: string
  name: string
  type: 'local' | 'cloud'
  created_at: number
  updated_at: number
}

export class WorkspaceModel {
  protected _entity: WorkspaceEntity

  @property({ alias: '_entity.id' }) declare id: WorkspaceEntity['id']
  @property({ alias: '_entity.name' }) declare name: WorkspaceEntity['name']
  @property({ alias: '_entity.type' }) declare type: WorkspaceEntity['type']
  @property({ alias: '_entity.created_at' }) declare createdAt: WorkspaceEntity['created_at']
  @property({ alias: '_entity.updated_at' }) declare updatedAt: WorkspaceEntity['updated_at']

  readonly docs = new Map<string, DocModel>()
  readonly doc: Y.Doc

  constructor(entity: WorkspaceEntity) {
    this._entity = entity
    this.doc = new Y.Doc({
      guid: this.id,
    })
  }

  addDoc(doc: DocModel): DocModel {
    if (this.docs.has(doc.id)) {
      throw new Error('doc already exists')
    }
    this.docs.set(doc.id, doc)
    return doc
  }
}
