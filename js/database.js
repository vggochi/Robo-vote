/* Banco local da demonstração: IndexedDB com fallback para localStorage.
   Nenhuma operação é enviada a um servidor real nesta versão. */
(() => {
  const DB_NAME = "robo-vote-db";
  const DB_VERSION = 1;
  let dbPromise;

  function openDB() {
    if (!("indexedDB" in window)) return Promise.resolve(null);
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("pending")) db.createObjectStore("pending", { keyPath: "id" });
        if (!db.objectStoreNames.contains("synced")) db.createObjectStore("synced", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  const fallback = {
    get(key) { try { return JSON.parse(localStorage.getItem("rv-" + key) || "[]"); } catch { return []; } },
    set(key, value) { localStorage.setItem("rv-" + key, JSON.stringify(value)); }
  };

  async function all(storeName) {
    const db = await openDB();
    if (!db) return fallback.get(storeName);
    return new Promise((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
  async function put(storeName, value) {
    const db = await openDB();
    if (!db) {
      const list = fallback.get(storeName);
      const index = list.findIndex(x => x.id === value.id);
      if (index >= 0) list[index] = value; else list.push(value);
      fallback.set(storeName, list); return value;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error);
    });
  }
  async function remove(storeName, id) {
    const db = await openDB();
    if (!db) { fallback.set(storeName, fallback.get(storeName).filter(x => x.id !== id)); return; }
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
  window.RoboDB = {
    async addPending(record) { return put("pending", record); },
    async getPending() { return all("pending"); },
    async getSynced() { return all("synced"); },
    async markSynced(record) { await put("synced", record); await remove("pending", record.id); },
    async allVotes() { return [...await all("synced"), ...await all("pending")]; }
  };
})();