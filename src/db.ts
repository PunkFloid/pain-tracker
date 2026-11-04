export type Pain = { id: string; start: string; end: string | null; intensity: number; note: string }
export type Medication = { id: string; at: string; name: string; strength: string; count: number; painId: string | null; note: string }
export type Data = { pains: Pain[]; medications: Medication[] }
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('pain-tracker', 1)
    r.onupgradeneeded = () => { r.result.createObjectStore('state') }
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.onblocked = () => reject(new Error('Zavři ostatní karty aplikace a obnov stránku.'))
  })
}
export async function readData(): Promise<Data> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readonly')
    const r = tx.objectStore('state').get('data')
    tx.oncomplete = () => { db.close(); resolve(r.result ?? { pains: [], medications: [] }) }
    tx.onerror = () => { db.close(); reject(tx.error) }
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Čtení přerušeno.')) }
  })
}
export async function writeData(data: Data): Promise<void> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', 'readwrite')
    tx.objectStore('state').put(data, 'data')
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Uložení přerušeno.')) }
  })
}
