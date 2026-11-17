// Firebase connection shared by the TV display and the phone controller.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getDatabase, ref, onValue, update, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// The wall id is a long random key in the link (#w=...). It is never stored in
// the repo, so only people with the link can see or control the wall.
export function wallId() {
  const m = location.hash.match(/w=([A-Za-z0-9_-]{12,})/);
  if (m) { localStorage.setItem('pixelWallId', m[1]); return m[1]; }
  return localStorage.getItem('pixelWallId');
}

export function newWallId() {
  const a = new Uint8Array(15);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_');
}

export function watchState(id, cb) {
  return onValue(ref(db, `walls/${id}/state`), snap => cb(snap.val() || {}));
}

export function setState(id, patch) {
  return update(ref(db, `walls/${id}/state`), { ...patch, updatedAt: serverTimestamp() });
}

export function watchConnection(cb) {
  return onValue(ref(db, '.info/connected'), snap => cb(!!snap.val()));
}
