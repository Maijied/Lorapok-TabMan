# Project: Lorapok TabMan

## 📡 Overview
Lorapok TabMan is a specialized productivity tool for Firefox users, combining a browser extension with a centralized React-based dashboard. It targets power users who struggle with "tab fatigue" and system resource exhaustion.

## 🎨 Design System
- **Company**: Lorapok Labs
- **Primary Palette**: 
  - Background: Navy `#030711`
  - Accent: Sky Blue `#38bdf8`
  - Text: Slate `#94a3b8`
- **Aesthetic**: Brutalist-Modern. High-contrast, sharp borders, bold typography (Space Grotesk/Inter), and fluid animations (Framer Motion).

## 🧩 Architectural Blueprint

### 1. The Extension (Manifest V3)
- **Location**: `public/extension/`
- **Strategy**: Captures the state of all open tabs in the current window on toolbar click. Also runs the Tab Snooze inactivity tracker.
- **Data Flow**: Serializes tab metadata (ID, URL, Title, Favicon) into a `tabGroup` object and persists it to `browser.storage.local`.
- **Permissions**: `tabs`, `storage`, `activeTab`, `notifications`, `alarms`

#### Tab Snooze System (Extension Side)
The Snooze System runs entirely inside `background.js` using the MV3-compatible `browser.alarms` API (not `setInterval`, which is lost on service worker termination).

**Storage keys in `browser.storage.local`:**
- `snoozeTimeoutMinutes` — user-configured inactivity threshold (default: `30`, min: `1`, max: `10080`)
- `lastActiveMap` — object keyed by tab ID, value is Unix ms timestamp of last activity: `{ "123": 1715000000000 }`

**Event listeners:**
- `browser.tabs.onActivated` → calls `updateLastActive(tabId)` to reset the timer
- `browser.tabs.onUpdated` (when `status === 'complete'`) → calls `updateLastActive(tabId)`
- `browser.tabs.onRemoved` → calls `removeFromLastActiveMap(tabId)` to clean up

**Alarm check (every 1 minute):**
```javascript
browser.alarms.create('snoozeCheck', { periodInMinutes: 1 });
browser.alarms.onAlarm.addListener(async (alarm) => {
  // Reads snoozeTimeoutMinutes and lastActiveMap from storage
  // Queries non-discarded, non-pinned tabs
  // Calls browser.tabs.discard(tabId) for tabs exceeding the threshold
});
```

**Pure helper (unit-testable):**
```javascript
function shouldSnooze(lastActive, now, thresholdMs) {
  return (now - lastActive) >= thresholdMs;
}
```

### 2. The Dashboard (React 19)
- **Location**: `src/pages/Dashboard.tsx`
- **State Management**: Reactive hooks that listen for storage changes.
- **Dual-Storage Engine**:
  - **Local**: Fallback to `localStorage` for guest sessions.
  - **Firebase**: Firestore for authenticated cloud sync with atomic updates.
- **Advanced Features**:
  - **Hierarchical Tagging**: Group-level and individual Tab-level tags for multi-dimensional filtering.
  - **Bulk Operations**: Mass tagging and deletion using selection set state.
  - **Granular Sync Engine**: Real-time status monitoring (Offline, Syncing, Success, Error) with `AnimatePresence` transitions.
  - **Power User Mapping**: System-wide keyboard shortcuts for rapid navigation and management.
  - **Tab Snooze Visual**: Snoozed tab entries render with `blur-[2px] opacity-50` and a centered `public/logo.png` overlay. This is per-tab-entry, not per-group-card. The `isSnoozed` field is read-only in the Dashboard — it is set by the extension via `browser.storage.local`, never written to Firestore.

#### Tab Snooze System (Dashboard Side)
- `Tab` interface in `src/types.ts` has `isSnoozed?: boolean` — transient, per-device, never synced to Firestore
- `snoozeTimeoutMinutes` state in Dashboard reads from `browser.storage.local` on mount (guarded with `typeof browser !== 'undefined'`)
- Settings → Tab Snooze section: number input (min 1, max 10080 minutes) saved to `browser.storage.local` on "Commit Preferences"
- Snoozed tab overlay: `<div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 backdrop-blur-sm z-10"><img src="/logo.png" /></div>`

### 3. Backend (Firebase)
- **Authentication**: Google OAuth popup + Email/Password.
- **Database**: Firestore.
- **Configuration**: All Firebase config values are sourced from `import.meta.env` (`VITE_FIREBASE_*` variables), never from committed JSON files. See `.env.example` for the full list of required variables.
- **Security**: Strict ABAC (Attribute-Based Access Control). Validation helpers enforce key integrity and identity verification on every write.
- **Firestore Rules**: `firestore.rules` — allowed update keys for `groups/{groupId}` include `name`, `isStarred`, `isLocked`, `isArchived`, `tabs`, `tags`, `updatedAt`. Allowed update keys for `users/{userId}` include `email`, `lastSync`, `displayName`, `name`, `updatedAt`.

## 🛠 Project Structure Detail
- `public/extension/manifest.json`: Defines permissions (`tabs`, `storage`, `activeTab`, `notifications`, `alarms`).
- `public/extension/background.js`: Tab capture + Tab Snooze inactivity tracking + alarm-based discard logic.
- `public/extension/icons/`: Brand icons at 6 sizes (16, 32, 48, 64, 96, 128px) — generated from `public/logo.png`.
- `src/lib/firebase.ts`: Singleton for Firebase initialization. Reads config from `import.meta.env.VITE_FIREBASE_*`. Calls `validateFirebaseConfig()` on startup to log descriptive errors for any missing variables.
- `src/lib/storage.ts`: Unified API for switching between local and cloud storage.
- `src/types.ts`: Shared interfaces for `TabGroup` and `Tab`. `Tab` includes `isSnoozed?: boolean`.
- `src/pages/Dashboard.tsx`: Monolithic dashboard core handling all views (Groups, Archive, Analytics, Settings, Help).
- `firestore.rules`: Firebase security rules with ABAC enforcement.
- `.env.example`: Documents all 7 required `VITE_FIREBASE_*` environment variables.

## 🚀 CI/CD Pipeline

### Dashboard Deploy (`.github/workflows/deploy.yml`)
- **Trigger**: Push to `main`
- **Action**: Builds the React app with Vite, injects Firebase config from GitHub Actions secrets as `VITE_*` env vars, deploys `dist/` to `gh-pages` branch via `JamesIves/github-pages-deploy-action@v4`
- **Required secrets**: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_DATABASE_ID`

### Firefox Extension Publish (`.github/workflows/publish-firefox.yml`)
- **Trigger**: Push to `main` with path filter `public/extension/**`, or manual `workflow_dispatch`
- **Action**: Bumps patch version in `manifest.json`, packages ZIP (`manifest.json` + `background.js` + `icons/`), signs with `web-ext sign`, uploads artifact, commits version bump back to `main`
- **Required secrets**: `AMO_API_KEY` (Mozilla AMO JWT issuer), `AMO_API_SECRET` (Mozilla AMO JWT secret)
- **Note**: The `web-ext sign` step uses `continue-on-error: true` so the artifact upload always runs even if AMO signing fails

## 📝 Roadmap & Constraints
- **Completed**: Bulk tagging, keyboard shortcuts, tab-level metadata, enhanced sync status, Tab Snooze System, CI/CD pipelines, Firebase env var migration, Firestore rules fixes.
- **Roadmap**: AI-powered auto-tagging, memory usage tracking per domain, and cross-browser tab migration.
- **Constraint**: The extension must remain lightweight — avoiding heavy dependencies in `background.js`. The `browser.alarms` API is used instead of `setInterval` for MV3 service worker compatibility.
