<!-- src/pages/ProfilePage.vue -->
<script setup>
import { computed } from 'vue';
import { useProfile, saveProfile } from '@/services/profile.js';

// Bytt denne til din auth-kilde (Firebase Auth el.l.)
const userId = 'demo-user-id';

const { data: profile, loading, error } = useProfile(userId);
const displayName = computed({
  get: () => profile.value?.displayName ?? '',
  set: v => saveProfile(userId, { displayName: v }) // lagrer fortløpende (enkelt)
});
</script>

<template>
  <section>
    <h2>Profil</h2>

    <p v-if="loading">Laster…</p>
    <p v-if="error">Feil: {{ error.message }}</p>

    <div v-if="profile !== null">
      <label>
        Navn:
        <input v-model="displayName" placeholder="Ditt navn" />
      </label>
      <pre>{{ profile }}</pre>
    </div>
  </section>
</template>
