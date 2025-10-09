import type { ReactivableEvents } from 'modern-idoc'
import type { Transaction } from 'yjs'
import { idGenerator, property, Reactivable } from 'modern-idoc'
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

export interface ModelProps {
  id: string
}

export class Model extends Reactivable {
  protected _transacting: boolean | undefined = undefined
  protected _yDoc: Y.Doc
  protected _yProps: Y.Map<unknown>

  @property({ alias: '_yDoc.guid' }) declare id: string

  constructor(options: Partial<ModelProps> = {}) {
    super()
    const { id = idGenerator(), ...props } = options
    this._yDoc = markRaw(new Y.Doc({ guid: id }))
    this._yDoc.on('update', (...args) => this.emit('update', ...args))
    this._yProps = this._yDoc.getMap('props')
    this._propertyAccessor = {
      getProperty: key => this._yProps.doc ? this._yProps.get(key) : undefined,
      setProperty: (key, value) => {
        this.transact(() => this._yProps.set(key, value))
      },
    }
    this.setProperties(props)
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

  reset(): this {
    this._yProps.clear()
    return this
  }
}
