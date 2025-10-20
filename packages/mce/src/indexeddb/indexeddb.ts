export function rtop(request: IDBRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    request.onerror = event => reject(new Error((event.target as any).error))
    request.onsuccess = event => resolve((event.target as any).result)
  })
}

export function openDB(name: string, initDB: (arg0: IDBDatabase) => any): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name)
    request.onupgradeneeded = event => initDB((event.target as any).result)
    request.onerror = event => reject(new Error((event.target as any).error))
    request.onsuccess = (event) => {
      const db = (event.target as any).result
      db.onversionchange = () => {
        db.close()
      }
      resolve(db)
    }
  })
}

export function deleteDB(name: string): Promise<void> {
  return rtop(indexedDB.deleteDatabase(name))
}

export function createStores(
  db: IDBDatabase,
  definitions: Array<Array<string> | Array<string | IDBObjectStoreParameters | undefined>>,
): void {
  return definitions.forEach(d => (db.createObjectStore as any).apply(db, d))
}

export function transact(
  db: IDBDatabase,
  stores: Array<string>,
  access: 'readwrite' | 'readonly' = 'readwrite',
): Array<IDBObjectStore> {
  const transaction = db.transaction(stores, access)
  return stores.map(store => getStore(transaction, store))
}

export function count(store: IDBObjectStore, range?: IDBKeyRange): Promise<number> {
  return rtop(store.count(range))
}

export function get(store: IDBObjectStore, key: IDBValidKey): Promise<string | number | ArrayBuffer | Date | any[]> {
  return rtop(store.get(key))
}

export function del(store: IDBObjectStore, key: IDBValidKey): Promise<any> {
  return rtop(store.delete(key))
}

export function put(store: IDBObjectStore, item: any, key?: IDBValidKey): Promise<any> {
  return rtop(store.put(item, key))
}

export function add(store: IDBObjectStore, item: any, key: IDBValidKey): Promise<any> {
  return rtop(store.add(item, key))
}

export function addAutoKey(store: IDBObjectStore, item: any): Promise<number> {
  return rtop(store.add(item))
}

export function getAll(store: IDBObjectStore, range?: IDBKeyRange, limit?: number): Promise<any[]> {
  return rtop(store.getAll(range, limit))
}

export function getAllKeys(store: IDBObjectStore, range?: IDBKeyRange, limit?: number): Promise<any[]> {
  return rtop(store.getAllKeys(range, limit))
}

export function queryFirst(
  store: IDBObjectStore,
  query: IDBKeyRange | undefined,
  direction: 'next' | 'prev' | 'nextunique' | 'prevunique',
): Promise<any> {
  let first: any = null
  return iterateKeys(
    store,
    query,
    (key) => {
      first = key
      return false
    },
    direction,
  ).then(() => first)
}

export function getLastKey(store: IDBObjectStore, range?: IDBKeyRange): Promise<any> {
  return queryFirst(store, range, 'prev')
}

export function getFirstKey(store: IDBObjectStore, range?: IDBKeyRange): Promise<any> {
  return queryFirst(store, range, 'next')
}

export function getAllKeysValues(store: IDBObjectStore, range?: IDBKeyRange, limit?: number): Promise<any[]> {
  return Promise.all([
    getAllKeys(store, range, limit),
    getAll(store, range, limit),
  ]).then(([ks, vs]) => ks.map((k, i) => ({ k, v: vs[i] })))
}

function iterateOnRequest(request: IDBRequest, f: (arg0: any) => any): Promise<void> {
  return new Promise((resolve, reject) => {
    request.onerror = reject
    request.onsuccess = async (event) => {
      const cursor = (event.target as any).result
      if (cursor === null || (await f(cursor)) === false) {
        return resolve()
      }
      cursor.continue()
    }
  })
}

export function iterate(
  store: IDBObjectStore,
  keyrange: IDBKeyRange | null,
  f: (arg0: any, arg1: any) => void | boolean | Promise<void | boolean>,
  direction: 'next' | 'prev' | 'nextunique' | 'prevunique' = 'next',
): Promise<void> {
  return iterateOnRequest(
    store.openCursor(keyrange, direction),
    cursor => f(cursor.value, cursor.key),
  )
}

export function iterateKeys(
  store: IDBObjectStore,
  keyrange: IDBKeyRange | undefined,
  f: (arg0: any) => void | boolean | Promise<void | boolean>,
  direction: 'next' | 'prev' | 'nextunique' | 'prevunique' = 'next',
): Promise<void> {
  return iterateOnRequest(
    store.openKeyCursor(keyrange, direction),
    cursor => f(cursor.key),
  )
}

export function getStore(t: IDBTransaction, store: string): IDBObjectStore {
  return t.objectStore(store)
}

export function createIDBKeyRangeBound(lower: any, upper: any, lowerOpen?: boolean, upperOpen?: boolean): IDBKeyRange {
  return IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen)
}

export function createIDBKeyRangeUpperBound(upper: any, upperOpen?: boolean): IDBKeyRange {
  return IDBKeyRange.upperBound(upper, upperOpen)
}

export function createIDBKeyRangeLowerBound(lower: any, lowerOpen?: boolean): IDBKeyRange {
  return IDBKeyRange.lowerBound(lower, lowerOpen)
}
