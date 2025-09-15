// src/services/profile.js
import { bindDoc, setDocAt, updateDocAt, serverTimestamp } from '@/lib/firestore.js';

// Realtime profil (per brukerId). Velg din datastruktur.
export function useProfile(userId) {
  return bindDoc(`users/${userId}`);
}

// Opprett/overskriv hele profilen (merge valgfritt)
export async function saveProfile(userId, data, { merge = true } = {}) {
  return setDocAt(`users/${userId}`, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge });
}

// Delvis oppdatering
export async function updateProfile(userId, partial) {
  return updateDocAt(`users/${userId}`, {
    ...partial,
    updatedAt: serverTimestamp(),
  });
}
