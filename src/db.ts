/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Browser-only persistence layer backed by IndexedDB.
 * All data stays on the user's device — nothing is ever sent to a server.
 */

import { Contraction } from './types';

const DB_NAME = 'contraction_timer_db';
const DB_VERSION = 1;
const CONTRACTIONS_STORE = 'contractions';
const META_STORE = 'meta';
const ACTIVE_KEY = 'active_contraction';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      dbPromise = null;
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONTRACTIONS_STORE)) {
        const store = db.createObjectStore(CONTRACTIONS_STORE, { keyPath: 'id' });
        store.createIndex('startTime', 'startTime');
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

function tx(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode
): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store);
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Load every recorded contraction, sorted newest-first by startTime. */
export async function getAllContractions(): Promise<Contraction[]> {
  const db = await openDB();
  const all = await promisify<Contraction[]>(tx(db, CONTRACTIONS_STORE, 'readonly').getAll());
  return all.sort((a, b) => b.startTime - a.startTime);
}

/** Replace the entire contraction collection atomically. */
export async function putAllContractions(list: Contraction[]): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(CONTRACTIONS_STORE, 'readwrite');
    const store = transaction.objectStore(CONTRACTIONS_STORE);
    store.clear();
    for (const c of list) store.put(c);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/** Wipe all recorded contractions. */
export async function clearContractions(): Promise<void> {
  const db = await openDB();
  await promisify(tx(db, CONTRACTIONS_STORE, 'readwrite').clear());
}

/** Load the in-progress contraction (if the app was closed mid-wave). */
export async function getActiveContraction(): Promise<Contraction | null> {
  const db = await openDB();
  const value = await promisify<Contraction | undefined>(
    tx(db, META_STORE, 'readonly').get(ACTIVE_KEY)
  );
  return value ?? null;
}

/** Persist or clear the in-progress contraction. */
export async function setActiveContraction(
  contraction: Contraction | null
): Promise<void> {
  const db = await openDB();
  const store = tx(db, META_STORE, 'readwrite');
  if (contraction) {
    await promisify(store.put(contraction, ACTIVE_KEY));
  } else {
    await promisify(store.delete(ACTIVE_KEY));
  }
}
