import type { ObservableEvents } from 'modern-idoc'
import { Observable } from 'modern-idoc'
import * as Y from 'yjs'
import * as idb from './indexeddb'

const customStoreName = 'custom'
const updatesStoreName = 'updates'

export const PREFERRED_TRIM_SIZE = 500

export function fetchUpdates(
  idbPersistence: IndexeddbProvider,
  beforeApplyUpdatesCallback?: ((arg0: IDBObjectStore) => void) | undefined,
  afterApplyUpdatesCallback?: ((arg0: IDBObjectStore) => void) | undefined,
): Promise<IDBObjectStore> {
  const [updatesStore] = idb.transact(
    idbPersistence.db!,
    [updatesStoreName],
  )
  const range = idb.createIDBKeyRangeLowerBound(idbPersistence._dbref, false)
  return idb.getAll(updatesStore, range)
    .then((updates) => {
      if (!idbPersistence._destroyed) {
        beforeApplyUpdatesCallback?.(updatesStore)
        Y.transact(idbPersistence.doc, () => {
          updates.forEach(val => Y.applyUpdate(idbPersistence.doc, val))
        }, idbPersistence, false)
        afterApplyUpdatesCallback?.(updatesStore)
      }
    })
    .then(() => idb.getLastKey(updatesStore).then((lastKey) => {
      idbPersistence._dbref = lastKey + 1
    }))
    .then(() => idb.count(updatesStore).then((cnt) => {
      idbPersistence._dbsize = cnt
    }))
    .then(() => updatesStore)
}

export function storeState(
  idbPersistence: IndexeddbProvider,
  forceStore = true,
): Promise<void> {
  return fetchUpdates(idbPersistence)
    .then((updatesStore) => {
      if (forceStore || idbPersistence._dbsize >= PREFERRED_TRIM_SIZE) {
        idb.addAutoKey(updatesStore, Y.encodeStateAsUpdate(idbPersistence.doc))
          .then(() => idb.del(
            updatesStore,
            idb.createIDBKeyRangeUpperBound(idbPersistence._dbref, true) as any,
          ))
          .then(() => idb.count(updatesStore).then((cnt) => {
            idbPersistence._dbsize = cnt
          }))
      }
    })
}

export const clearDocument = (name: string): Promise<void> => idb.deleteDB(name)

interface IndexeddbProviderEvents extends ObservableEvents {
  synced: [db: IndexeddbProvider]
}

export class IndexeddbProvider extends Observable<IndexeddbProviderEvents> {
  db: IDBDatabase | null = null
  synced = false
  whenSynced: Promise<IndexeddbProvider>

  _dbref = 0
  _dbsize = 0
  _destroyed = false
  _db: Promise<IDBDatabase>
  _storeTimeout = 1000
  _storeTimeoutId: any = null
  _storeUpdate: (update: Uint8Array, origin: any) => void

  constructor(
    public name: string,
    public doc: Y.Doc,
  ) {
    super()

    this._db = idb.openDB(name, (db) => {
      idb.createStores(db, [
        ['updates', { autoIncrement: true }],
        ['custom'],
      ])
    })

    this.whenSynced = new Promise(resolve => this.on('synced', () => resolve(this)))

    this._db.then((db) => {
      this.db = db

      fetchUpdates(
        this,
        (updatesStore) => {
          return idb.addAutoKey(updatesStore, Y.encodeStateAsUpdate(doc))
        },
        () => {
          if (this._destroyed)
            return
          this.synced = true
          this.emit('synced', this)
        },
      )
    })

    this._storeUpdate = (update: Uint8Array, origin: any) => {
      if (this.db && origin !== this) {
        const [updatesStore] = idb.transact(this.db, [updatesStoreName])
        idb.addAutoKey(updatesStore, update)
        if (++this._dbsize >= PREFERRED_TRIM_SIZE) {
          // debounce store call
          if (this._storeTimeoutId !== null) {
            clearTimeout(this._storeTimeoutId)
          }
          this._storeTimeoutId = setTimeout(() => {
            storeState(this, false)
            this._storeTimeoutId = null
          }, this._storeTimeout)
        }
      }
    }
    doc.on('update', this._storeUpdate)

    this.destroy = this.destroy.bind(this)
    doc.on('destroy', this.destroy)
  }

  destroy() {
    if (this._storeTimeoutId) {
      clearTimeout(this._storeTimeoutId)
    }
    this.doc.off('update', this._storeUpdate)
    this.doc.off('destroy', this.destroy)
    this._destroyed = true
    return this._db.then((db) => {
      db.close()
    })
  }

  clearData() {
    return this.destroy().then(() => {
      idb.deleteDB(this.name)
    })
  }

  get<T = any>(key: IDBValidKey): Promise<T> {
    return this._db.then((db) => {
      const [custom] = idb.transact(db, [customStoreName], 'readonly')
      return idb.get(custom, key) as T
    })
  }

  set<T = any>(key: IDBValidKey, value: T): Promise<T> {
    return this._db.then((db) => {
      const [custom] = idb.transact(db, [customStoreName])
      return idb.put(custom, value, key) as T
    })
  }

  del(key: IDBValidKey) {
    return this._db.then((db) => {
      const [custom] = idb.transact(db, [customStoreName])
      return idb.del(custom, key)
    })
  }
}
