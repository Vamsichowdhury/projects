# Troubleshooting Guide

Common issues, error messages, and solutions.

---

## 🔴 App Issues

### Issue: Loading Spinner Never Disappears

**Symptoms**: App shows loading icon indefinitely; no habits load

**Root Causes**:
1. Firebase credentials invalid in `.env.local`
2. Firestore not enabled in Firebase Console
3. Network connection lost
4. Firestore security rules deny access

**Solutions**:
1. **Check `.env.local`**:
   ```bash
   cat .env.local
   # Verify all 6 values are present and match Firebase Console
   ```

2. **Check Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click **Firestore Database**
   - Should show "Firestore in Datastore mode" at top
   - If not enabled, click "Create database" in test mode

3. **Check Network**:
   - Open browser DevTools → Network tab
   - Reload page
   - Look for requests to `firestore.googleapis.com`
   - Should not be errors (red)

4. **Check Security Rules**:
   - Firebase Console → Firestore → Rules
   - Should have:
     ```javascript
     match /{document=**} {
       allow read, write: if true;  // For development only!
     }
     ```
   - Publish rules if you edited them

5. **Check Browser Console for Errors**:
   - F12 → Console tab
   - Any red error messages?
   - Firebase errors will show here

### Issue: Can Create Habit, But It Doesn't Appear

**Symptoms**: Click "Create" → dialog closes, but habit doesn't show in list

**Root Causes**:
1. Firestore write succeeded, but read listener hasn't synced yet (race condition)
2. Firestore write failed silently (check console errors)
3. App is showing cached/stale data

**Solutions**:
1. **Wait a few seconds** — Firestore needs time to sync
2. **Check browser console** for Firebase errors
3. **Hard-refresh**: Ctrl+Shift+R (not just Ctrl+R)
4. **Check Firestore Console** — Does habit appear there?
   - Firebase Console → Firestore → habits collection
   - Should see new habit doc
5. **Clear browser storage**:
   - DevTools → Application → Clear storage → Clear site data
   - Refresh page

### Issue: "Permission denied" Errors in Console

**Symptoms**: Errors like `PERMISSION_DENIED: Missing or insufficient permissions`

**Root Cause**: Firestore security rules don't allow read/write

**Solution**:
1. Firebase Console → Firestore → Rules
2. Set to open for development:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Click **Publish**
4. Wait ~30 seconds for deployment
5. Refresh browser

### Issue: Dark Mode Cells Are Invisible

**Symptoms**: Dark theme enabled; empty heatmap cells are invisible (same color as background)

**Root Cause**: Dark mode `--heatmap-0` color hasn't been updated

**Solution** (already fixed in latest code):
- File: `src/styles/variables.scss`
- Check `.v-theme--dark` has: `--heatmap-0: #21262d;`
- If wrong, update and reload

---

## 🟡 Feature Issues

### Issue: Streak Calculation Seems Wrong

**Symptoms**: Streak shows 3, but should be 5 (or vice versa)

**Root Causes**:
1. Frequency mismatch (habit is weekly, but app counting daily)
2. Date format wrong (inconsistent YYYY-MM-DD)
3. Entries not synced yet

**Debug Steps**:
1. Open browser DevTools → Vue DevTools
2. Expand `habit` store → check `entries`
3. Look for entries matching the habit + recent dates
4. Check entry dates are in `YYYY-MM-DD` format
5. For daily: should be consecutive days (no gaps)
6. For weekly: should be 7 days apart
7. For monthly: should be same date each month

**Fix**:
- If date format wrong, delete entries manually and recreate
- If frequency wrong, use Edit dialog to change (old entries stay)

### Issue: Clicking Pixel Opens Dialog, But "Save" Doesn't Work

**Symptoms**: Set rating, add notes, click "Save" → dialog stays open, no error

**Root Causes**:
1. Firestore connection lost
2. Async operation didn't complete (app is waiting)
3. Browser console showing errors

**Solutions**:
1. **Check browser console** for errors (F12)
2. **Wait longer** — Firestore takes time
3. **Check network tab** — Is the write request happening?
4. **Try refreshing** — Force app to re-sync

### Issue: Habit Frequency Can't Be Changed

**Symptoms**: Edit dialog opens, but frequency selector is disabled or doesn't update

**Root Cause**: App bug or Vue reactivity issue

**Solution**:
1. Close dialog with X button (not Cancel)
2. Open edit again
3. Try changing frequency
4. If still stuck, clear browser storage and refresh

### Issue: Colored Cells Fade/Change When I Mark Another Pixel

**Symptoms**: Cell was dark (rating 5), now lighter (rating 1), after marking a different pixel

**Root Cause**: Bug in heatmap color calculation or state sync

**Solution**:
1. Refresh page (F5)
2. Check all pixels are correct in Firestore Console
3. If Firestore is correct, file a bug report with:
   - Habit name and frequency
   - Which pixel changed
   - Before/after ratings

---

## 🟠 UI/Display Issues

### Issue: Heatmap Cells Look Huge or Tiny

**Symptoms**: Pixels are 20px instead of 10px, or vice versa

**Root Cause**: CSS not loaded or cell size props misconfigured

**Solution**:
1. Check `src/components/heatmap/HeatmapCell.vue`
2. Look for `cellSize` computed property
3. Default should be `10px` for daily, `13px` for weekly, `28px` for monthly
4. If wrong, update and rebuild: `npm run dev`

### Issue: Colors Look Wrong / Not Theme-Aware

**Symptoms**: Dark mode doesn't look right; colors don't match GitHub

**Solution**:
1. Check `src/styles/variables.scss` has correct colors
2. Check `.v-theme--dark` CSS class is being applied (F12 → Inspector)
3. Restart dev server: `npm run dev`

### Issue: Dialogs Overlapping or Misaligned

**Symptoms**: Two dialogs show at once; dialog buttons off-screen

**Root Cause**: Vuetify CSS not loaded or z-index conflict

**Solution**:
1. Hard refresh: Ctrl+Shift+R
2. Check `src/main.ts` imports Vuetify correctly
3. Check no custom CSS overriding Vuetify

### Issue: Text Overflowing or Cut Off

**Symptoms**: Long habit names don't fit; text goes outside box

**Solution**:
1. Add `text-overflow: ellipsis; white-space: nowrap;` to component styles
2. Or truncate in code: `habit.name.slice(0, 30) + '...'`

---

## 🔵 Build & Deploy Issues

### Issue: `npm run build` Fails

**Symptoms**: Build errors; `dist/` folder not created

**Likely Errors**:
- **TypeScript errors**: Run `npm run type-check` to see details
- **Vite config errors**: Check `vite.config.ts` syntax
- **Missing dependencies**: Run `npm install`

**Solutions**:
```bash
npm run type-check          # See TypeScript issues
npm run lint                # See linting issues
npm install                 # Reinstall dependencies
npm run build               # Try building again
```

### Issue: Build Succeeds, But App Crashes on Load

**Symptoms**: `npm run preview` shows blank page or errors in console

**Root Causes**:
1. `.env` variables not found (production build doesn't have `.env.local`)
2. Vite config misconfiguration
3. Dynamic imports failing

**Solutions**:
1. **Check Vite config** (`vite.config.ts`):
   ```typescript
   // Must export defineConfig
   export default defineConfig({
     // ...
   })
   ```

2. **For Firebase in production**:
   - If deploying to Firebase Hosting, use `.env.example` as `.env`
   - Inject values via build script or environment variables

### Issue: Firebase Hosting Deployment Fails

**Symptoms**: `firebase deploy` shows errors

**Solutions**:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Verify project ID
firebase projects:list

# Set project
firebase use --add

# Try deploying
firebase deploy --only hosting
```

---

## 💬 Help & Support

### Debugging Checklist

Before reporting a bug, confirm:

- [ ] Tried hard-refresh (Ctrl+Shift+R)
- [ ] Checked browser console for errors (F12)
- [ ] Checked Firestore Console for data
- [ ] Checked `.env.local` has correct Firebase credentials
- [ ] Checked security rules allow read/write
- [ ] Tried on a different browser
- [ ] Restarted dev server (`npm run dev`)

### How to Report a Bug

Include:
1. **Exact steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser + OS** (Chrome 120 on Windows 10)
5. **Console errors** (copy + paste from F12)
6. **Firestore state** (screenshot of habits/entries)

---

## 📚 More Help

- Firebase Docs: https://firebase.google.com/docs/firestore/troubleshoot
- Vue 3 Docs: https://vuejs.org/
- Vuetify Troubleshooting: https://vuetifyjs.com/en/introduction/frequently-asked-questions/
- See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for debugging tips
