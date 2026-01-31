import type { ObservableEvents } from 'modern-idoc'
import type { Transaction } from 'yjs'
import { idGenerator, Observable } from 'modern-idoc'
import { markRaw } from 'vue'
import * as Y from 'yjs'
import { IndexeddbProvider } from '../indexeddb'

export interface YModelEvents extends ObservableEvents {
  history: [arg0: Y.UndoManager]
  update: [arg0: Uint8Array, arg1: any, arg2: Y.Doc, arg3: Transaction]
}

export interface YModel {
  on: <K extends keyof YModelEvents & string>(event: K, listener: (...args: YModelEvents[K]) => void) => this
  once: <K extends keyof YModelEvents & string>(event: K, listener: (...args: YModelEvents[K]) => void) => this
  off: <K extends keyof YModelEvents & string>(event: K, listener: (...args: YModelEvents[K]) => void) => this
  emit: <K extends keyof YModelEvents & string>(event: K, ...args: YModelEvents[K]) => this
}

export class YModel extends Observable {
  _transacting: boolean | undefined = undefined
  _yDoc: Y.Doc
  _yProps: Y.Map<unknown>
  indexeddb?: IndexeddbProvider
  declare undoManager: Y.UndoManager
  protected _ready = false

  constructor(
    public id = idGenerator(),
  ) {
    super()
    this._yDoc = markRaw(new Y.Doc({ guid: this.id }))
    this._yDoc.on('update', (...args) => this.emit('update', ...args))
    this._yProps = markRaw(this._yDoc.getMap('props'))
  }

  protected _setupUndoManager(typeScope: any[] = []): void {
    const um = markRaw(new Y.UndoManager([
      this._yProps,
      ...typeScope,
    ], {
      trackedOrigins: new Set([this._yDoc.clientID]),
    }))
    um.trackedOrigins.add(um)
    const onHistory = (): void => {
      this.emit('history', um)
    }
    um.on('stack-item-added', onHistory)
    um.on('stack-item-updated', onHistory)
    um.on('stack-item-popped', onHistory)
    um.on('stack-cleared', onHistory)
    this.undoManager = um
  }

  async loadIndexeddb(): Promise<void> {
    const indexeddb = new IndexeddbProvider(this._yDoc.guid, this._yDoc)
    this.indexeddb = await indexeddb.whenSynced
    console.info('loaded data from indexed db')
  }

  transact<T>(fn: () => T, should = true): T {
    if (this._transacting !== undefined) {
      return fn()
    }
    this._transacting = should
    let result = undefined as T
    const doc = this._yDoc
    doc.transact(
      () => {
        try {
          result = fn()
        }
        catch (e) {
          console.error(
            `An error occurred while Y.doc ${doc.guid} transacting:`,
          )
          console.error(e)
        }
      },
      should ? doc.clientID : null,
    )
    this._transacting = undefined
    return result!
  }

  async load(initFn?: () => void | Promise<void>): Promise<this> {
    if (this._ready) {
      return this
    }
    this._ready = true
    await this.transact(async () => {
      this._yDoc.load()
      await initFn?.()
    }, false)
    this.undoManager.clear()
    return this
  }

  reset(): this {
    this._yProps.clear()
    return this
  }
}
