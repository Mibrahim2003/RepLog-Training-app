# RepLog

RepLog is a mobile-first workout logging web app with a Neo-Brutalist UI, Google sign-in, Firestore-backed persistence, and session draft recovery for in-progress workouts.

## Stack

- `React + TypeScript + Vite`
- `Firebase Authentication` with `GoogleAuthProvider`
- `Cloud Firestore`
- `React Router`

## What Is Implemented

- Real auth bootstrap with `getRedirectResult()` followed by `onAuthStateChanged()`
- Protected routes that wait for auth to leave `loading`
- Firestore-backed user profile, workouts, templates, and custom exercises
- Static system muscle groups and exercise catalog in app code
- Session draft persistence in `sessionStorage` for new and edit workout flows
- Resume/discard prompt for stored drafts after sign-in
- Client-side PR annotation for:
  - heaviest set
  - most reps in one set
  - highest total workout volume

## Firebase Setup

1. Create a Firebase project.
2. Enable `Authentication > Sign-in method > Google`.
3. Create a `Cloud Firestore` database in production or test mode.
4. Add these authorized domains in Firebase Authentication:
   - `localhost`
   - your future Vercel domain
5. Copy `.env.example` to `.env.local`.
6. Fill in the Firebase web app credentials from `Project settings > General > Your apps`.
7. Publish the Firestore rules from [firestore.rules](./firestore.rules).

## Environment Variables

Create `.env.local` with:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Firestore Structure

- `users/{uid}`
  - profile document
- `users/{uid}/workouts/{workoutId}`
  - workout document with embedded exercise blocks and sets
- `users/{uid}/templates/{templateId}`
  - saved workout templates
- `users/{uid}/customExercises/{exerciseId}`
  - user-owned exercises

## Local Development

```bash
npm install
npm run dev
```

Open the local Vite URL in your browser. On desktop widths the app renders inside a mobile preview shell.

## Quality Checks

```bash
npm run lint
npm run build
```

## Notes

- If Firebase env vars are missing, the sign-in screen stays visible and shows a setup message instead of attempting auth.
- Drafts are browser-session scoped and keyed per signed-in user.
- Workouts and templates start empty in the real app path. The old seeded mock data is no longer used at runtime.
