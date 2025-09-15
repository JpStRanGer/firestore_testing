<!-- src/App.vue -->
<script setup>
import TodosPage from '@/pages/TodosPage.vue';
import ProfilePage from '@/pages/ProfilePage.vue';
import ProfilePage2 from '@/pages/ProfilePageWcreate.vue';

const show = 'todos'; // bytt til 'profile' for å se profil-siden
// const show = 'profile'; // bytt til 'profile' for å se profil-siden
</script>

<template>
  <main style="max-width: 720px; margin: 2rem auto; padding: 1rem;">
    <h1>Firestore + Services (mal)</h1>
    <TodosPage v-if="show === 'todos'" />
    <ProfilePage />

  </main>
</template>
