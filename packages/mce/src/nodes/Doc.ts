import type { NodeEvents } from 'modern-canvas'
import type { Document } from 'modern-idoc'
import type * as Y from 'yjs'
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
  _yDoc: YDoc
  protected _source: any

  constructor(
    source?: Mce.DocumentSource,
    protected readonly _localDb = false,
  ) {
    super({
      name: 'Doc',
    })

    let id: string | undefined
    let _source: any | undefined
    if (typeof source === 'string') {
      id = source
    }
    else if (source) {
      if (Array.isArray(source) && source.length === 1) {
        _source = source[0]
      }
      else {
        _source = source
      }

      if (_source && !Array.isArray(_source)) {
        if (_source.meta?.inEditorIs === 'Doc') {
          id = _source.id
        }
        else {
          _source = [_source]
        }
      }
    }

    const _doc = new YDoc(id)
    _doc._yProps.set('id', this.id)
    _doc._yProps.set('name', this.name)
    _doc.on(
      'update',
      throttle((update, origin) => this.emit('update', update, origin), 200),
    )
    _doc.on('history', um => this.emit('history', um))
    _doc._proxyRoot(this)

    this._yDoc = _doc
    this._source = _source
  }

  transact = <T>(fn: () => T, should = true): T => {
    return this._yDoc.transact(fn, should)
  }

  undo = (): void => {
    this._yDoc.undoManager.undo()
  }

  redo = (): void => {
    this._yDoc.undoManager.redo()
  }

  stopCapturing = (): void => {
    this._yDoc.undoManager.stopCapturing()
  }

  clearHistory = (): void => {
    this._yDoc.undoManager.clear()
  }

  set = (source: Document): this => {
    const { children = [], ...props } = source
    const oldTransacting = this._yDoc._transacting
    this._yDoc.reset()
    this._yDoc._transacting = true
    this.stopCapturing()
    this.resetProperties()
    this.removeChildren()
    this.setProperties(props)
    this.append(children)
    this._yDoc._transacting = oldTransacting
    return this
  }

  load = async (): Promise<void> => {
    const source = this._source
    this._source = undefined
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
          this.set({ children: source })
        }
        else {
          this.set(source)
        }
      }
    })
  }

  destroy = () => {
    super.destroy()
    this._yDoc.destroy()
  }
}
