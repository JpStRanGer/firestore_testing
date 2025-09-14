// firestore.js
// Én gjenbrukbar modul for alle prosjektene dine.
// Krav: npm i firebase
// Bruk i Vue 3 (Vite): import funksjoner fra denne filen – ikke fra 'firebase/*'.

// --- Firebase SDK (modular) ---
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence,
  doc, collection, query, onSnapshot, getDoc, getDocs,
  addDoc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction,
  serverTimestamp as _serverTimestamp,
  orderBy, where, limit, startAfter, endBefore, startAt, endAt
} from "firebase/firestore";

// --- Vue reaktivitet ---
import { ref, shallowRef, onUnmounted } from "vue";

/** @typedef {{ [key: string]: any, id?: string }} AnyDoc */

// -------------------------
// Singleton state
// -------------------------
let _app = null;
let _db = null;
const _unsubs = new Set(); // sporer aktive listeners, for ev. manuell rydding

// -------------------------
// Init / config
// -------------------------

/**
 * Initialiser Firebase/Firestore én gang.
 * @param {object} firebaseConfig  Firebase config fra konsollen (apiKey, authDomain, ...).
 * @param {{ emulator?: { host:string, port:number }, persistence?: boolean }} [opts]
 */
export function initFirebase(firebaseConfig, opts = {}) {
  if (!_app) {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    _db = getFirestore(_app);

    if (opts?.emulator) {
      connectFirestoreEmulator(_db, opts.emulator.host, opts.emulator.port);
    }

    // Slå på offline persistence som standard (kan skippes på SSR)
    if (opts?.persistence !== false && typeof window !== "undefined") {
      enableIndexedDbPersistence(_db).catch(() => {
        // Kan feile i private mode / flere tabs med lyttere.
        // Bevisst "best effort" – ingen throw; appen fungerer videre online.
      });
    }
  }
  return { app: _app, db: _db };
}

/** @returns {import('firebase/firestore').Firestore} */
function _ensureDb() {
  if (!_db) {
    throw new Error("Firestore er ikke initialisert. Kall initFirebase(...) først.");
  }
  return _db;
}

// -------------------------
// Path helpers (lesbarhet)
// -------------------------

/**
 * @param {string} path Som "todos" eller "users/UID/todos"
 */
export function colRef(path) {
  return collection(_ensureDb(), path);
}

/**
 * @param {string} path Som "todos/ID" eller "users/UID/profile"
 */
export function docRef(path) {
  return doc(_ensureDb(), path);
}

/** Generer en ny ID uten å skrive data. */
export function newId(pathToCollection) {
  return doc(colRef(pathToCollection)).id;
}

/** Firestore serverTimestamp */
export const serverTimestamp = _serverTimestamp;

// -------------------------
// Realtime binders (Vue-reaktive)
// -------------------------

/**
 * Realtime reaktiv binding til ETT dokument.
 * @param {string} path "todos/abc123"
 * @returns {{ data: import('vue').Ref<AnyDoc|null>, loading: import('vue').Ref<boolean>, error: import('vue').Ref<Error|null>, unsubscribe: () => void }}
 */
export function bindDoc(path) {
  const data = shallowRef(null);
  const loading = ref(true);
  const error = ref(null);

  const unsub = onSnapshot(
    docRef(path),
    (snap) => {
      data.value = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      loading.value = false;
    },
    (err) => {
      error.value = err;
      loading.value = false;
    }
  );

  _unsubs.add(unsub);
  // Auto-opprydding hvis kalt fra en komponent
  try { onUnmounted(() => { unsub(); _unsubs.delete(unsub); }); } catch {
    // utdypende feilmelding hvis onUnmounted ikke finnes
    if (typeof onUnmounted !== 'function') {
      console.warn("bindDoc: onUnmounted finnes ikke. Er du sikker på at du bruker Vue 3?");
    }
  }

  return {
    data, loading, error,
    unsubscribe: () => { unsub(); _unsubs.delete(unsub); }
  };
}

/**
 * Realtime reaktiv binding til en KOLLEKSJON (evt. med query-constraints).
 * Eksempel constraints: [where('done','==',false), orderBy('createdAt','desc'), limit(20)]
 * @param {string} path "todos" eller "users/UID/todos"
 * @param {Array} [constraints]
 * @returns {{ data: import('vue').Ref<AnyDoc[]>, loading: import('vue').Ref<boolean>, error: import('vue').Ref<Error|null>, unsubscribe: () => void }}
 */
export function bindCollection(path, constraints = []) {
  const items = shallowRef([]);
  const loading = ref(true);
  const error = ref(null);

  const q = constraints?.length ? query(colRef(path), ...constraints) : colRef(path);

  const unsub = onSnapshot(
    q,
    (snap) => {
      items.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      loading.value = false;
    },
    (err) => {
      error.value = err;
      loading.value = false;
    }
  );

  _unsubs.add(unsub);
  try { onUnmounted(() => { unsub(); _unsubs.delete(unsub); }); } catch {
    if (typeof onUnmounted !== 'function') {
      console.warn("bindCollection: onUnmounted finnes ikke. Er du sikker på at du bruker Vue 3?");
    }
  }

  return {
    data: items, loading, error,
    unsubscribe: () => { unsub(); _unsubs.delete(unsub); }
  };
}

// -------------------------
// Once (engangshentinger)
// -------------------------

/** @param {string} path "todos/ID" */
export async function getDocOnce(path) {
  const snap = await getDoc(docRef(path));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** @param {string} path "todos" */
export async function getCollectionOnce(path, constraints = []) {
  const q = constraints?.length ? query(colRef(path), ...constraints) : colRef(path);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// -------------------------
// CRUD (enkle helpers)
// -------------------------

/** @param {string} pathToCollection "todos" */
export async function addDocTo(pathToCollection, data) {
  const ref = await addDoc(colRef(pathToCollection), data);
  return ref.id;
}

/** @param {string} pathToDoc "todos/ID" */
export async function setDocAt(pathToDoc, data, opts = { merge: false }) {
  await setDoc(docRef(pathToDoc), data, opts);
}

/** @param {string} pathToDoc "todos/ID" */
export async function updateDocAt(pathToDoc, partial) {
  await updateDoc(docRef(pathToDoc), partial);
}

/** @param {string} pathToDoc "todos/ID" */
export async function deleteDocAt(pathToDoc) {
  await deleteDoc(docRef(pathToDoc));
}

// -------------------------
// Batch / Transaction
// -------------------------

/**
 * Batch-skriv: send inn en funksjon som får 'batch' og bygg operasjonene selv.
 * Eksempel:
 *   await runBatch(batch => {
 *     batch.set(docRef('todos/a'), {...});
 *     batch.update(docRef('todos/b'), {...});
 *   })
 */
export async function runBatch(builderFn) {
  const db = _ensureDb();
  const batch = writeBatch(db);
  await builderFn(batch);
  await batch.commit();
}

/**
 * Transaksjon: les -> skriv atomisk.
 * Eksempel:
 *   await runTx(async (tx) => {
 *     const snap = await tx.get(docRef('counters/main'));
 *     const next = (snap.data()?.value || 0) + 1;
 *     tx.set(docRef('counters/main'), { value: next }, { merge: true });
 *   })
 */
export async function runTx(fn) {
  const db = _ensureDb();
  return runTransaction(db, fn);
}

// -------------------------
// Paging helpers (valgfrie)
// -------------------------

export const qOrderBy = orderBy;
export const qWhere = where;
export const qLimit = limit;
export const qStartAt = startAt;
export const qEndAt = endAt;
export const qStartAfter = startAfter;
export const qEndBefore = endBefore;

// -------------------------
// Rydding
// -------------------------

/** Kall hvis du vil eksplisitt stoppe alle aktive lyttere (f.eks. ved logout). */
export function stopAllListeners() {
  for (const u of _unsubs) {
    try { u(); } catch {
      // utdypende feilmelding hvis u ikke er en funksjon
      if (typeof u !== 'function') {
        console.warn("stopAllListeners: en av _unsubs er ikke en funksjon. Er noe galt?");
      }
    }
  }
  _unsubs.clear();
}
