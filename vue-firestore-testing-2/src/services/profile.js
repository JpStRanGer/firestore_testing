// src/services/profile.js
import { bindDoc, setDocAt, updateDocAt, serverTimestamp } from '@/lib/firestore.js';

// Realtime profil (per brukerId). Velg din datastruktur.
export function useProfile(userId) {
  return bindDoc(`users/${userId}/profile`);
}

// Opprett/overskriv hele profilen (merge valgfritt)
export async function saveProfile(userId, data, { merge = true } = {}) {
  return setDocAt(`users/${userId}/profile`, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge });
}

// Delvis oppdatering
export async function updateProfile(userId, partial) {
  return updateDocAt(`users/${userId}/profile`, {
    ...partial,
    updatedAt: serverTimestamp(),
  });
}
