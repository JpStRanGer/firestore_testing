import { createApp } from 'vue'
import App from './App.vue'

import { initFirebase } from './lib/firestore.js';
console.log('Firebase config:', {
  test: import.meta.env,
  vue_test: import.meta.env.VUE_TEST,
  vite_test: import.meta.env.VITE_TEST,
  apiKey: import.meta.env.VITE_FIRESTORE_API_KEY,
  authDomain: import.meta.env.VITE_FIRESTORE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIRESTORE_PROJECT_ID,
});
initFirebase(
  {
    apiKey: import.meta.env.VITE_FIRESTORE_API_KEY,
    authDomain: import.meta.env.VITE_FIRESTORE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIRESTORE_PROJECT_ID,
    StorageBucket: import.meta.env.VITE_FIRESTORE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIRESTORE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIRESTORE_APP_ID,
    measurementId: import.meta.env.VITE_FIRESTORE_MEASUREMENT_ID,

  },
  {
    // emulator: { host: '127.0.0.1', port: 8080 }, // skru på i dev hvis ønskelig
    persistence: true // offline cache
  }
);

createApp(App).mount('#app')
