// src/services/todos.js
import {
bindCollection, bindDoc,
addDocTo, updateDocAt, deleteDocAt,
serverTimestamp,
qWhere, qOrderBy, qLimit
} from '@/lib/firestore.js';

// Realtime liste over aktive todos
export function useTodos() {
return bindCollection('todos', [
qWhere('archived', '==', false),
qOrderBy('createdAt', 'desc'),
qLimit(100),
]);
}

// Realtime én todo (om du trenger detaljside)
export function useTodo(id) {
return bindDoc(`todos/${id}`);
}

// Commands (ren API uten Firestore-detaljer)
export async function createTodo(title) {
return addDocTo('todos', {
title,
archived: false,
createdAt: serverTimestamp(),
});
}

export async function toggleArchived(todo) {
return updateDocAt(`todos/${todo.id}`, { archived: !todo.archived });
}

export async function removeTodo(todo) {
return deleteDocAt(`todos/${todo.id}`);
}
