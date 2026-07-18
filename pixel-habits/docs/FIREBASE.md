# Firebase Setup & Configuration

Complete guide to Firebase Firestore setup, environment variables, and security rules.

---

## 🚀 Initial Setup (One-Time)

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it (e.g., "pixel-habits")
4. Skip Google Analytics (not needed)
5. Click **"Create project"** and wait

### Step 2: Enable Firestore

1. In Firebase Console, go to **Firestore Database** (left sidebar)
2. Click **"Create database"**
3. Choose **"Start in test mode"** (allows open read/write for development)
   - ⚠️ **Production**: Change security rules later (see [Security Rules](#-production-security-rules) below)
4. Choose region (us-east1 recommended for North America)
5. Click **"Enable"**

### Step 3: Enable Authentication Providers

The app supports Email/Password, Google, and Anonymous authentication:

1. Firebase Console → **Authentication** (left sidebar)
2. Click **"Sign-in method"** tab
3. Click **"Email/Password"** → Enable → Save
4. Click **"Google"** → Enable → add your dev email as a test user → Save
5. Click **"Anonymous"** → Enable → Save
6. Go to **"Settings"** tab → confirm `localhost` and your prod domain are in "Authorized domains" (required for Google popup sign-in)

### Step 4: Get Firebase Config

1. In Firebase Console, click **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **"</> Web"** icon (if no apps, add one)
4. Copy the config object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyD...",
     authDomain: "pixel-habits-abc.firebaseapp.com",
     projectId: "pixel-habits-abc",
     storageBucket: "pixel-habits-abc.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123def456"
   };
   ```

### Step 5: Set Environment Variables

1. In your project, create `.env.local` (copy from `.env.example`):
   ```
   VITE_FIREBASE_API_KEY=AIzaSyD...
   VITE_FIREBASE_AUTH_DOMAIN=pixel-habits-abc.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=pixel-habits-abc
   VITE_FIREBASE_STORAGE_BUCKET=pixel-habits-abc.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
   ```

2. **Never commit `.env.local`** to Git (add to `.gitignore`)
3. Each developer/environment gets their own `.env.local`

### Step 4: Deploy Security Rules

1. Copy the contents of `firestore.rules` (at repo root) 
2. Firebase Console → **Firestore Database** → **Rules** tab
3. Paste the rules and click **"Publish"**
   - Alternatively, use `firebase deploy --only firestore:rules` if you have `firebase-tools` installed

### Step 5: Test Connection

1. Run `npm run dev`
2. You should be redirected to `/login`
3. Sign up with email or continue as guest
4. Click **[+]** to add a habit
5. If it appears immediately and persists after refresh → Firestore is working! ✅

---

## 🔧 Environment Variables (Detailed)

All values must be strings and should be prefixed with `VITE_` to be accessible in the app:

| Variable | Example | Where from | Use |
|----------|---------|-----------|-----|
| `VITE_FIREBASE_API_KEY` | `AIzaSyD...` | Firebase Console → Project Settings | Authentication with Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `pixel-habits-abc.firebaseapp.com` | Firebase Console → Project Settings | OAuth redirect domain |
| `VITE_FIREBASE_PROJECT_ID` | `pixel-habits-abc` | Firebase Console → Project Settings | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `pixel-habits-abc.appspot.com` | Firebase Console → Project Settings | Cloud Storage (not used yet) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Firebase Console → Project Settings | Firebase Cloud Messaging (not used yet) |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abc123def456` | Firebase Console → Project Settings | App registration ID |

**How to access in code**:
```typescript
// In src/firebase/firebase.ts
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
```

Vite automatically loads `.env.local` at build/dev time.

---

## 📚 Collections & Documents

Data is organized per-user under `users/{uid}/` for privacy and security:

### `users/{userId}/habits` Collection

**Structure**:
```javascript
Collection: users/{userId}/habits
└── Document: <auto-id>
    ├── name: string
    ├── emoji: string
    ├── color: string
    ├── frequency: string ('daily' | 'weekly' | 'monthly')
    └── createdAt: string (ISO 8601)
```

**Example**:
```json
{
  "1Abc2def3Ghi": {
    "name": "Morning Run",
    "emoji": "🏃",
    "color": "#2196f3",
    "frequency": "daily",
    "createdAt": "2025-01-15T08:30:00.000Z"
  }
}
```

### `users/{userId}/entries` Collection

**Structure**:
```javascript
Collection: users/{userId}/entries
└── Document: <auto-id>
    ├── habitId: string (reference to habits/<habit-id>)
    ├── date: string ('YYYY-MM-DD')
    ├── rating: number (1-5)
    └── description: string
```

**Example**:
```json
{
  "entry-xyz789": {
    "habitId": "1Abc2def3Ghi",
    "date": "2025-01-15",
    "rating": 4,
    "description": "Ran 5 miles in 45 minutes"
  }
}
```

---

## 🔐 Security Rules (In Use)

The app uses per-user security rules enforced via Firebase Authentication. Rules are defined in `firestore.rules` at the repo root and must be deployed to Firebase Console:

**Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /habits/{habitId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

**To deploy**:
1. Copy the rules from `firestore.rules` (repo root)
2. Firebase Console → Firestore Database → Rules tab → Paste & Publish
3. Or: `firebase deploy --only firestore:rules` (if firebase-tools installed)

These rules ensure authenticated users can only access their own data under `users/{uid}/`.

---

## 🔍 Debugging Firestore

### View Database in Console

1. Firebase Console → **Firestore Database**
2. See all documents in real-time
3. Can manually add/edit/delete documents (for testing)

### Enable Offline Persistence (Advanced)

Currently, app requires internet. To cache locally:

```typescript
// In src/firebase/firebase.ts
import { enableIndexedDbPersistence } from 'firebase/firestore'

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore offline persistence failed: multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore offline persistence not supported')
  }
})
```

With this, app will:
- Cache data locally in IndexedDB
- Sync queued writes when back online
- Work offline (read-only without custom handling)

### Monitor Firestore Usage

Firebase Console → **Firestore Database** → **Stats**:
- Document reads/writes
- Storage used
- Network activity

Free tier includes 50,000 reads/day, plenty for personal use.

---

## 🐛 Common Issues

### Issue: "Error: Firebase App not initialized"

**Cause**: `.env.local` missing or invalid config

**Fix**:
1. Copy `.env.example` to `.env.local`
2. Fill in all 6 environment variables from Firebase Console
3. Restart dev server: `npm run dev`

### Issue: "Loading..." spinner never disappears

**Cause**: Auth or Firestore connection failed (wrong config, missing providers, or network issue)

**Debug**:
1. Open browser DevTools → Console
2. Look for Firebase errors (check especially for `auth/` errors or Firestore permission errors)
3. Check `.env.local` values match Firebase Console
4. Confirm Email/Password, Google, and Anonymous auth providers are enabled (Firebase Console → Authentication → Sign-in method)
5. Confirm security rules are deployed and correct (Firebase Console → Firestore → Rules)
6. Check internet connection
7. Verify Firestore is enabled in Firebase Console

### Issue: "Permission denied" errors in console

**Cause**: Security rules don't allow read/write

**Fix**:
1. Firebase Console → **Firestore Database** → **Rules**
2. If in test mode, should allow all (see rules above)
3. If changed rules, clear browser storage (Application → Clear all) and refresh

### Issue: Habit created but doesn't appear

**Cause**: 
1. Firestore write succeeded but read didn't sync
2. App uses `onSnapshot()` which should auto-sync

**Debug**:
1. Check Firestore Console → should see habit document
2. Check `store.loading` is false
3. Check browser console for errors
4. Try hard-refresh: Ctrl+Shift+R

### Issue: Changes don't sync between tabs

**Cause**: Each tab has separate Firestore connection

**Expected**: This is normal — Firestore syncs from server, but JS state is per-tab. To fix:
1. Implement browser storage sync (BroadcastChannel API)
2. Or just refresh the other tab

---

## 📝 Firestore Emulator (for Local Testing)

If you want to test locally without connecting to Firebase Cloud:

### Setup

```bash
npm install -g firebase-tools
firebase init emulators
firebase emulators:start
```

### Connect App

In `src/firebase/firebase.ts`:

```typescript
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
```

### Benefits
- No internet required
- Fast iteration
- No Firebase Cloud charges
- Data resets on restart (good for testing)

---

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
# Build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at `https://<project-id>.web.app`.

### Other Hosts

Since it's a static SPA, deploy anywhere:
- Vercel: `vercel`
- Netlify: Drop `/dist` folder
- GitHub Pages: Push to `gh-pages` branch
- AWS S3: `aws s3 sync dist/ s3://bucket/`

---

## 📊 Monitoring & Analytics

### Firebase Console Dashboards

- **Overview** — Active users, crashes, errors
- **Firestore Database** → **Stats** — Read/write activity, storage
- **Firestore Database** → **Indexes** — Query performance

### Application Insights (for Production)

Add monitoring:
```typescript
import { logEvent } from 'firebase/analytics'

logEvent(analytics, 'habit_created', {
  frequency: 'daily'
})
```

---

## ✅ Checklist

- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Email/Password, Google, and Anonymous auth providers enabled
- [ ] Authorized domains configured (localhost + prod domain)
- [ ] `.env.local` created with all 6 variables
- [ ] `firestore.rules` deployed to Firebase Console
- [ ] Dev server runs without errors
- [ ] Can sign up/sign in and land on homepage
- [ ] Can create a habit and it persists
- [ ] Page refresh shows saved data (user must remain signed in)
- [ ] Guest account can be linked to Google/email without losing data
- [ ] Dark/light mode works

---

## Next Steps

- For data model details, see [DATA_MODEL.md](./DATA_MODEL.md)
- For development workflow, see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
