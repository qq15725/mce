import type { ReactivableEvents } from 'modern-idoc'
import type { Transaction } from 'yjs'
import { property, Reactivable } from 'modern-idoc'
import { markRaw } from 'vue'
import * as Y from 'yjs'

export interface ModelEvents extends ReactivableEvents {
  update: [arg0: Uint8Array, arg1: any, arg2: Y.Doc, arg3: Transaction]
}

export interface Model {
  on: <K extends keyof ModelEvents & string>(event: K, listener: (...args: ModelEvents[K]) => void) => this
  once: <K extends keyof ModelEvents & string>(event: K, listener: (...args: ModelEvents[K]) => void) => this
  off: <K extends keyof ModelEvents & string>(event: K, listener: (...args: ModelEvents[K]) => void) => this
  emit: <K extends keyof ModelEvents & string>(event: K, ...args: ModelEvents[K]) => this
}

export class Model extends Reactivable {
  protected _transacting: boolean | undefined = undefined
  doc: Y.Doc

  @property({ alias: 'doc.guid' }) declare id: string

  constructor(id: string) {
    super()
    this.doc = markRaw(new Y.Doc({ guid: id }))
    this.doc.on('update', (...args) => this.emit('update', ...args))
  }

  transact<T>(fn: () => T, should = true): T {
    if (this._transacting !== undefined) {
      return fn()
    }
    this._transacting = should
    let result = undefined as T
    const doc = this.doc
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
}
