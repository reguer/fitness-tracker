# FitTracker — Firebase setup

La app funciona localmente sin Firebase. Para activar multiusuario real:

1. Crea un proyecto en Firebase.
2. Activa Authentication con:
   - Google
   - Email/password
3. Crea una base Cloud Firestore.
4. Agrega tu dominio de GitHub Pages en Authentication > Settings > Authorized domains.
5. Copia la configuración web del proyecto en `CONFIG.FIREBASE_CONFIG` dentro de `js/config.js`.

Estructura usada en Firestore:

- `users/{userId}/profile/current`
- `users/{userId}/programSettings/current`
- `users/{userId}/measurements/all`
- `users/{userId}/logs/{date}`
- `users/{userId}/nutrition/{date}`
- `users/{userId}/programOverrides/{key}`
- `users/{userId}/biomarkers/all`

Regla mínima sugerida:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
