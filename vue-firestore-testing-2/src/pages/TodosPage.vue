<!-- src/pages/TodosPage.vue -->
<script setup>
import { ref } from 'vue';
import { useTodos, createTodo, toggleArchived, removeTodo } from '@/services/todos.js';

const title = ref('');
const { data: todos, loading, error } = useTodos();

async function add() {
  if (!title.value.trim()) return;
  await createTodo(title.value.trim());
  title.value = '';
}
</script>

<template>
  <section>
    <h2>Todos</h2>

    <form @submit.prevent="add">
      <input v-model="title" placeholder="Ny todo…" required />
      <button>Legg til</button>
    </form>

    <p v-if="loading">Laster…</p>
    <p v-if="error">Feil: {{ error.message }}</p>

    <ul v-if="todos">
      <li v-for="t in todos" :key="t.id">
        <label>
          <input type="checkbox" :checked="t.archived" @change="toggleArchived(t)" />
          {{ t.title }}
        </label>
        <button @click="removeTodo(t)">Slett</button>
      </li>
    </ul>
    <!-- hvis ingen todos -->
    <p v-if="todos && todos.length === 0">Ingen todos enda.</p>
  </section>
</template>
