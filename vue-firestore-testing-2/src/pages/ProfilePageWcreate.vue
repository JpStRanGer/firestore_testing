<!-- src/pages/ProfilePage.vue -->
<script setup>
import { ref, computed, watch } from 'vue';
import { useProfile, saveProfile, updateProfile } from '@/services/profile.js';

// TODO: Bytt til din faktiske bruker-ID fra auth (Firebase Auth el.l.)
const userId = 'demo-user-id';

// Hent realtime-profilen
const { data: profile, loading, error } = useProfile(userId);

// Enkel vakt så vi bare forsøker å opprette én gang hvis dokumentet mangler
const triedCreate = ref(false);

// Standardprofil som brukes ved første gangs opprettelse
function defaultProfile() {
  return {
    displayName: 'Ny bruker',
    email: '',
    photoUrl: '',
    settings: {
      theme: 'light',
      language: 'no',
    },
    // createdAt/updatedAt settes inne i service via serverTimestamp()
  };
}

// Når vi får første snapshot: hvis dokumentet ikke finnes -> opprett
watch(
  () => ({ loading: loading.value, profile: profile.value }),
  async ({ loading, profile }) => {
    if (loading) return;
    if (profile === null && !triedCreate.value) {
      triedCreate.value = true;
      try {
        await saveProfile(userId, defaultProfile(), { merge: false });
        // Etter dette vil bindDoc få dokumentet og profile.value fylles automatisk
      } catch (e) {
        console.error('Kunne ikke opprette profil:', e);
      }
    }
  },
  { immediate: true, deep: false }
);

// To-veis bindinger til felter (lagrer fortløpende med debounce kan legges til senere)
const displayName = computed({
  get: () => profile.value?.displayName ?? '',
  set: (v) => updateProfile(userId, { displayName: v }),
});
const email = computed({
  get: () => profile.value?.email ?? '',
  set: (v) => updateProfile(userId, { email: v }),
});
const photoUrl = computed({
  get: () => profile.value?.photoUrl ?? '',
  set: (v) => updateProfile(userId, { photoUrl: v }),
});

async function setTheme(theme) {
  const current = profile.value?.settings ?? {};
  await updateProfile(userId, { settings: { ...current, theme } });
}
async function setLanguage(lang) {
  const current = profile.value?.settings ?? {};
  await updateProfile(userId, { settings: { ...current, language: lang } });
}
</script>

<template>
  <section>
    <h2>Profil</h2>

    <p v-if="loading">Laster…</p>
    <p v-if="error">Feil: {{ error?.message }}</p>

    <!-- Når dokumentet akkurat ble laget, vil profile være null et øyeblikk før den fylles -->
    <div v-if="!loading && profile === null">
      <p>Oppretter profil…</p>
    </div>

    <div v-else>
      <div style="display:grid; gap:0.75rem; max-width:520px;">
        <label>
          Navn
          <input v-model="displayName" placeholder="Ditt visningsnavn" />
        </label>

        <label>
          E-post
          <input v-model="email" placeholder="din@epost.no" />
        </label>

        <label>
          Bilde-URL
          <input v-model="photoUrl" placeholder="https://…" />
        </label>

        <div>
          <strong>Tema:</strong>
          <button @click="setTheme('light')">Lyst</button>
          <button @click="setTheme('dark')">Mørkt</button>
          <span> (nå: {{ profile?.settings?.theme ?? 'ukjent' }})</span>
        </div>

        <div>
          <strong>Språk:</strong>
          <button @click="setLanguage('no')">Norsk</button>
          <button @click="setLanguage('en')">Engelsk</button>
          <span> (nå: {{ profile?.settings?.language ?? 'ukjent' }})</span>
        </div>

        <details>
          <summary>Debug</summary>
          <pre>{{ profile }}</pre>
        </details>
      </div>
    </div>
  </section>
</template>
