import type { NodeEvents } from 'modern-canvas'
import type { Element } from 'modern-idoc'
import type * as Y from 'yjs'
import type { AddNodeOptions } from '../crdt'
import { throttle } from 'lodash-es'
import { Node } from 'modern-canvas'
import { YDoc } from '../crdt'

export interface DocEvents extends NodeEvents {
  update: [update: Uint8Array, origin: any]
  history: [arg0: Y.UndoManager]
}

export interface Doc {
  on: <K extends keyof DocEvents & string>(event: K, listener: (...args: DocEvents[K]) => void) => this
  once: <K extends keyof DocEvents & string>(event: K, listener: (...args: DocEvents[K]) => void) => this
  off: <K extends keyof DocEvents & string>(event: K, listener: (...args: DocEvents[K]) => void) => this
  emit: <K extends keyof DocEvents & string>(event: K, ...args: DocEvents[K]) => this
}

export class Doc extends Node {
  protected _yDoc: YDoc
  protected _source: any

  constructor(
    source?: Mce.DocumentSource,
    protected readonly _localDb = false,
  ) {
    super({
      name: 'Doc',
    })

    let id: string | undefined
    let _source: any = source
    if (typeof source === 'string') {
      id = source
    }
    else if (source) {
      if (Array.isArray(source) && source.length === 1) {
        _source = source[0]
      }

      if (!Array.isArray(_source)) {
        if (_source.meta?.inEditorIs === 'Doc') {
          id = _source.id
        }
        else {
          _source = [_source]
        }
      }
    }

    const _doc = new YDoc(this, id)

    _doc.on(
      'update',
      throttle((update, origin) => this.emit('update', update, origin), 200),
    )
    _doc.on('history', um => this.emit('history', um))

    this._yDoc = _doc
    this._source = _source
  }

  transact = <T>(fn: () => T, should = true): T => {
    return this._yDoc.transact(fn, should)
  }

  addNode = (data: Element, options?: AddNodeOptions): Node => {
    return this._yDoc.addNode(data, options)
  }

  undo = (): void => {
    this._yDoc.undoManager.undo()
  }

  redo = (): void => {
    this._yDoc.undoManager.redo()
  }

  async load(): Promise<void> {
    const source = this._source
    await this._yDoc.load(async () => {
      if (this._localDb) {
        try {
          await this._yDoc.loadIndexeddb()
        }
        catch (e) {
          console.error(e)
        }
      }
      if (source && typeof source !== 'string') {
        if (Array.isArray(source)) {
          this._yDoc.set({ children: source })
        }
        else {
          this._yDoc.set(source)
        }
      }
    })
  }
}
